import express from 'express';
import { db } from '../db/database.js';
import { requireAuth, requirePatientAccess, requireEditPermission } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate readable 6-character invite code
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SAATHI-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new patient profile (Onboarding)
 */
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      full_name,
      age,
      gender = 'Other',
      blood_group,
      conditions,
      allergies,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      relationship = 'Self',
    } = req.body;

    if (!full_name || !age) {
      return res.status(400).json({ error: 'Patient full name and age are required' });
    }

    // Generate unique invite code
    let invite_code = generateInviteCode();
    let exists = db.prepare('SELECT id FROM patients WHERE invite_code = ?').get(invite_code);
    while (exists) {
      invite_code = generateInviteCode();
      exists = db.prepare('SELECT id FROM patients WHERE invite_code = ?').get(invite_code);
    }

    const senior_user_id = req.user.role === 'senior' ? req.user.id : null;

    const insertPatient = db.prepare(`
      INSERT INTO patients (
        senior_user_id, full_name, age, gender, blood_group,
        conditions, allergies, emergency_contact_name, emergency_contact_phone,
        emergency_contact_relation, invite_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertPatient.run(
      senior_user_id,
      full_name.trim(),
      Number(age),
      gender,
      blood_group || null,
      conditions || null,
      allergies || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      emergency_contact_relation || null,
      invite_code
    );

    const patientId = Number(result.lastInsertRowid);

    // Automatically add creator to the Care Circle with full edit permissions
    db.prepare(`
      INSERT INTO care_circle (patient_id, user_id, role, relationship, can_edit, notification_pref)
      VALUES (?, ?, ?, ?, 1, 'all')
    `).run(patientId, req.user.id, req.user.role, relationship);

    // Record creation in activities audit
    db.prepare(`
      INSERT INTO activities (patient_id, user_id, action_type, title, details)
      VALUES (?, ?, 'patient_created', 'Patient Profile Created', ?)
    `).run(patientId, req.user.id, `Created care profile for ${full_name} with invite code ${invite_code}`);

    const newPatient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);

    return res.status(201).json({
      message: 'Patient profile created successfully',
      patient: newPatient,
      invite_code,
    });
  } catch (err) {
    console.error('[Create Patient Error]:', err);
    return res.status(500).json({ error: 'Failed to create patient profile' });
  }
});

/**
 * Join an existing patient profile's Care Circle via Invite Code
 */
router.post('/join', requireAuth, (req, res) => {
  try {
    const { invite_code, relationship = 'Family' } = req.body;

    if (!invite_code) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const normalizedCode = invite_code.toUpperCase().trim();
    const patient = db.prepare('SELECT * FROM patients WHERE invite_code = ?').get(normalizedCode);

    if (!patient) {
      return res.status(404).json({ error: 'Invalid invite code. No matching patient profile found.' });
    }

    // Check if already a member
    const existingMember = db.prepare('SELECT id FROM care_circle WHERE patient_id = ? AND user_id = ?')
      .get(patient.id, req.user.id);

    if (existingMember) {
      return res.status(409).json({ error: 'You are already a member of this patient’s Care Circle', patient });
    }

    // Add to Care Circle (Default: Caregivers and Family have edit permissions unless changed)
    db.prepare(`
      INSERT INTO care_circle (patient_id, user_id, role, relationship, can_edit, notification_pref)
      VALUES (?, ?, ?, ?, 1, 'all')
    `).run(patient.id, req.user.id, req.user.role, relationship);

    // Add activity record
    db.prepare(`
      INSERT INTO activities (patient_id, user_id, action_type, title, details)
      VALUES (?, ?, 'member_joined', 'Care Circle Member Joined', ?)
    `).run(patient.id, req.user.id, `${req.user.name} (${req.user.role}) joined as ${relationship}`);

    // Create notification for other members
    db.prepare(`
      INSERT INTO notifications (patient_id, title, message, type, priority)
      VALUES (?, ?, ?, 'care_circle', 'low')
    `).run(patient.id, 'New Care Circle Member', `${req.user.name} has joined the Care Circle as ${relationship}.`);

    return res.status(200).json({
      message: `Successfully joined ${patient.full_name}'s Care Circle`,
      patient,
    });
  } catch (err) {
    console.error('[Join Care Circle Error]:', err);
    return res.status(500).json({ error: 'Failed to join care circle' });
  }
});

/**
 * List all patient profiles accessible by current user
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const patients = db.prepare(`
      SELECT p.*, cc.role as circle_role, cc.relationship, cc.can_edit,
        (SELECT COUNT(*) FROM medications WHERE patient_id = p.id AND is_active = 1) as active_meds_count,
        (SELECT COUNT(*) FROM escalations WHERE patient_id = p.id AND status = 'active') as active_escalations_count
      FROM care_circle cc
      JOIN patients p ON cc.patient_id = p.id
      WHERE cc.user_id = ?
      ORDER BY p.full_name ASC
    `).all(req.user.id);

    return res.json({ patients });
  } catch (err) {
    console.error('[List Patients Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

/**
 * Get single patient details by ID
 */
router.get('/:patientId', requireAuth, requirePatientAccess, (req, res) => {
  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.patientId);
    const members = db.prepare(`
      SELECT cc.id as membership_id, cc.role, cc.relationship, cc.can_edit, cc.notification_pref, cc.joined_at,
             u.id as user_id, u.name, u.email, u.phone
      FROM care_circle cc
      JOIN users u ON cc.user_id = u.id
      WHERE cc.patient_id = ?
      ORDER BY cc.joined_at ASC
    `).all(req.params.patientId);

    return res.json({
      patient,
      care_circle: members,
      current_user_permissions: {
        role: req.membership.role,
        can_edit: req.membership.can_edit === 1,
      },
    });
  } catch (err) {
    console.error('[Get Patient Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch patient details' });
  }
});

/**
 * Update patient profile details
 */
router.put('/:patientId', requireAuth, requirePatientAccess, requireEditPermission, (req, res) => {
  try {
    const {
      full_name,
      age,
      gender,
      blood_group,
      conditions,
      allergies,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
    } = req.body;

    db.prepare(`
      UPDATE patients
      SET full_name = COALESCE(?, full_name),
          age = COALESCE(?, age),
          gender = COALESCE(?, gender),
          blood_group = COALESCE(?, blood_group),
          conditions = COALESCE(?, conditions),
          allergies = COALESCE(?, allergies),
          emergency_contact_name = COALESCE(?, emergency_contact_name),
          emergency_contact_phone = COALESCE(?, emergency_contact_phone),
          emergency_contact_relation = COALESCE(?, emergency_contact_relation),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      full_name, age, gender, blood_group, conditions, allergies,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      req.params.patientId
    );

    const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.patientId);
    return res.json({ message: 'Patient profile updated', patient: updated });
  } catch (err) {
    console.error('[Update Patient Error]:', err);
    return res.status(500).json({ error: 'Failed to update patient profile' });
  }
});

/**
 * Update member permissions in Care Circle (e.g. toggle can_edit)
 */
router.put('/:patientId/care-circle/:memberId', requireAuth, requirePatientAccess, requireEditPermission, (req, res) => {
  try {
    const { can_edit, role, relationship } = req.body;

    db.prepare(`
      UPDATE care_circle
      SET can_edit = COALESCE(?, can_edit),
          role = COALESCE(?, role),
          relationship = COALESCE(?, relationship)
      WHERE id = ? AND patient_id = ?
    `).run(can_edit !== undefined ? (can_edit ? 1 : 0) : null, role || null, relationship || null, req.params.memberId, req.params.patientId);

    return res.json({ message: 'Member permissions updated' });
  } catch (err) {
    console.error('[Update Care Circle Member Error]:', err);
    return res.status(500).json({ error: 'Failed to update member permissions' });
  }
});

/**
 * Remove a member from the Care Circle
 */
router.delete('/:patientId/care-circle/:memberId', requireAuth, requirePatientAccess, requireEditPermission, (req, res) => {
  try {
    db.prepare('DELETE FROM care_circle WHERE id = ? AND patient_id = ?').run(req.params.memberId, req.params.patientId);
    return res.json({ message: 'Member removed from Care Circle' });
  } catch (err) {
    console.error('[Delete Care Circle Member Error]:', err);
    return res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;
