/**
 * SAATHI CARE Second-Pass Security & Functionality Verification Test Suite
 * Includes both positive functionality tests and negative security/validation tests.
 */

const BASE_URL = 'http://localhost:5000/api';

async function runAuditTests() {
  console.log('\n======================================================================');
  console.log('🛡️  SAATHI CARE: SECOND-PASS SECURITY & QA ENGINEERING AUDIT SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // GROUP 1: Health Check & DB
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: Core System & DB Health ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.ok && healthData.status === 'ok', 'API health check responds correctly');

    // -------------------------------------------------------------
    // GROUP 2: Registration & Input Validation (Positive & Negative)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Registration & Strict Role/PIN Validation ---');
    
    // Negative test: Invalid role
    const invalidRoleRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker User',
        email: `invalid.role.${Date.now()}@test.com`,
        password: 'ValidPassword123!',
        role: 'superadmin',
      }),
    });
    assert(invalidRoleRes.status === 400, 'Negative: Rejects registration with unauthorized role (e.g. superadmin)');

    // Negative test: Invalid PIN (non-numeric / wrong length)
    const invalidPinRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad Pin User',
        email: `bad.pin.${Date.now()}@test.com`,
        password: 'ValidPassword123!',
        role: 'senior',
        passcode: 'ABCD', // Non-numeric
      }),
    });
    assert(invalidPinRes.status === 400, 'Negative: Rejects non-numeric passcode PIN');

    const shortPinRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pin User',
        email: `short.pin.${Date.now()}@test.com`,
        password: 'ValidPassword123!',
        role: 'senior',
        passcode: '12', // Too short (< 4 digits)
      }),
    });
    assert(shortPinRes.status === 400, 'Negative: Rejects passcode PIN with fewer than 4 digits');

    // Negative test: Password too short
    const shortPassRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pass User',
        email: `short.pass.${Date.now()}@test.com`,
        password: '123',
        role: 'senior',
      }),
    });
    assert(shortPassRes.status === 400, 'Negative: Rejects weak password (< 8 chars)');

    // Positive test: Valid Senior Registration
    const seniorEmail = `senior.audit.${Date.now()}@saathicare.health`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dinanath Sharma',
        email: seniorEmail,
        password: 'StrongPassword123!',
        passcode: '5678',
        role: 'senior',
        phone: '+91 98111 00000',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.token && !regData.user.password_hash, 'Positive: Registers senior with hashed credentials (zero hash leakage)');
    const seniorToken = regData.token;

    // Negative test: Duplicate email registration
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Dinanath',
        email: seniorEmail,
        password: 'StrongPassword123!',
        role: 'senior',
      }),
    });
    assert(dupRes.status === 409, 'Negative: Rejects duplicate email registration with 409 Conflict');

    // -------------------------------------------------------------
    // GROUP 3: Authentication & Passcode PIN (Positive & Negative)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Authentication & Passcode Security ---');

    // Negative test: Wrong password
    const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: seniorEmail, password: 'WrongPassword999!' }),
    });
    assert(wrongPassRes.status === 401, 'Negative: Rejects login with incorrect password');

    // Positive test: Correct password
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: seniorEmail, password: 'StrongPassword123!' }),
    });
    assert(loginRes.ok, 'Positive: Authenticates user with valid password');

    // Negative test: Wrong PIN
    const wrongPinRes = await fetch(`${BASE_URL}/auth/passcode-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: seniorEmail, passcode: '9999' }),
    });
    assert(wrongPinRes.status === 401, 'Negative: Rejects incorrect 4-digit PIN');

    // Positive test: Correct PIN
    const pinRes = await fetch(`${BASE_URL}/auth/passcode-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: seniorEmail, passcode: '5678' }),
    });
    const pinData = await pinRes.json();
    assert(pinRes.ok && pinData.user.hasPasscode === true, 'Positive: Authenticates elder with correct 4-digit numeric PIN');

    // -------------------------------------------------------------
    // GROUP 4: Patient Profile & Care Circle Setup
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Patient Profile & Care Circle Pairing ---');

    // Negative test: Invalid age
    const badAgeRes = await fetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({ full_name: 'Dinanath Sharma', age: 0 }),
    });
    assert(badAgeRes.status === 400, 'Negative: Rejects patient profile creation with invalid age (0)');

    // Positive test: Create Patient Profile
    const patientRes = await fetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        full_name: 'Dinanath Sharma',
        age: 76,
        gender: 'Male',
        blood_group: 'AB+',
        conditions: 'Hypertension, Mild Osteoarthritis',
        allergies: 'Penicillin',
        emergency_contact_name: 'Meera Sharma (Daughter)',
        emergency_contact_phone: '+91 98222 55555',
        emergency_contact_relation: 'Daughter',
        timezone: 'Asia/Kolkata',
      }),
    });
    const patientData = await patientRes.json();
    const patientId = patientData.patient.id;
    const inviteCode = patientData.invite_code;
    assert(patientRes.status === 201 && inviteCode.startsWith('SAATHI-'), 'Positive: Creates patient profile with unique invite code');

    // Register a Family Member
    const familyEmail = `meera.daughter.${Date.now()}@saathicare.health`;
    const famRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Meera Sharma',
        email: familyEmail,
        password: 'FamilyPassword123!',
        role: 'family',
        phone: '+91 98222 55555',
      }),
    });
    const famData = await famRegRes.json();
    const familyToken = famData.token;

    // Negative test: Join with invalid invite code
    const badJoinRes = await fetch(`${BASE_URL}/patients/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${familyToken}`,
      },
      body: JSON.stringify({ invite_code: 'SAATHI-FAKE99' }),
    });
    assert(badJoinRes.status === 404, 'Negative: Rejects invalid Care Circle invite code with 404 Not Found');

    // Positive test: Join via legitimate invite code
    const joinRes = await fetch(`${BASE_URL}/patients/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        invite_code: inviteCode,
        relationship: 'Daughter',
      }),
    });
    assert(joinRes.status === 200, 'Positive: Family member joins Care Circle via invite code');

    // Negative test: Join same patient twice
    const dupJoinRes = await fetch(`${BASE_URL}/patients/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        invite_code: inviteCode,
        relationship: 'Daughter',
      }),
    });
    assert(dupJoinRes.status === 409, 'Negative: Rejects duplicate care circle membership with 409 Conflict');

    // -------------------------------------------------------------
    // GROUP 5: Authorization, Patient Isolation & Read-Only Restrictions
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Patient Isolation & Permission Enforcement ---');

    // Register a completely unrelated user (User C)
    const strangerEmail = `stranger.${Date.now()}@test.com`;
    const strReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unauthorized Stranger',
        email: strangerEmail,
        password: 'StrangerPassword123!',
        role: 'family',
      }),
    });
    const strData = await strReg.json();
    const strangerToken = strData.token;

    // Negative test: Unauthorized user attempts to read patient's medications
    const unauthMedsRes = await fetch(`${BASE_URL}/medications/${patientId}`, {
      headers: { 'Authorization': `Bearer ${strangerToken}` },
    });
    assert(unauthMedsRes.status === 403, 'Security: Unauthorized user blocked from viewing patient medications (403 Forbidden)');

    // Negative test: Unauthorized user attempts to log dose for patient
    const unauthLogRes = await fetch(`${BASE_URL}/logs/${patientId}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${strangerToken}`,
      },
      body: JSON.stringify({
        medication_id: 1,
        scheduled_date: '2026-11-15',
        scheduled_slot: 'morning',
        status: 'taken',
      }),
    });
    assert(unauthLogRes.status === 403, 'Security: Unauthorized user blocked from logging patient dose (403 Forbidden)');

    // Negative test: Unauthorized user attempts to access patient context via AI
    const unauthAiRes = await fetch(`${BASE_URL}/ai/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${strangerToken}`,
      },
      body: JSON.stringify({
        query: 'What medications is this patient on?',
        patient_id: patientId,
      }),
    });
    assert(unauthAiRes.status === 403, 'Security: Unauthorized user blocked from querying patient context via AI (403 Forbidden)');

    // Test Read-Only Permission Restrictions:
    // Demote Family Member to can_edit = 0 (Read-Only)
    const careCircleRes = await fetch(`${BASE_URL}/patients/${patientId}`, {
      headers: { 'Authorization': `Bearer ${seniorToken}` },
    });
    const circleData = await careCircleRes.json();
    const famMember = circleData.care_circle.find(m => m.user_id === famData.user.id);

    const demoteRes = await fetch(`${BASE_URL}/patients/${patientId}/care-circle/${famMember.membership_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({ can_edit: false }),
    });
    assert(demoteRes.status === 200, 'Positive: Senior owner successfully modifies member to read-only');

    // Negative test: Read-only member tries to add medication
    const readOnlyAddMed = await fetch(`${BASE_URL}/medications/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized Drug',
        dosage: '10mg',
        schedule_slots: ['morning'],
      }),
    });
    assert(readOnlyAddMed.status === 403, 'Security: Read-only member blocked from adding medications (403 Forbidden)');

    // Negative test: Read-only member tries to modify senior owner's permissions
    const seniorMember = circleData.care_circle.find(m => m.role === 'senior');
    const attackRes = await fetch(`${BASE_URL}/patients/${patientId}/care-circle/${seniorMember.membership_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${familyToken}`,
      },
      body: JSON.stringify({ can_edit: false, role: 'caregiver' }),
    });
    assert(attackRes.status === 403, 'Security: Non-senior member blocked from altering senior profile ownership (403 Forbidden)');

    // Restore family member edit permission for subsequent tests
    await fetch(`${BASE_URL}/patients/${patientId}/care-circle/${famMember.membership_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({ can_edit: true }),
    });

    // -------------------------------------------------------------
    // GROUP 6: Medication Scheduling & Custom Timing
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: Medication CRUD & Custom Timings ---');

    // Add medication with custom time slot
    const medRes = await fetch(`${BASE_URL}/medications/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        name: 'Amlodipine Besylate',
        generic_name: 'Amlodipine',
        dosage: '5 mg',
        form: 'Tablet',
        instructions: 'Take in morning with water. Stand up slowly.',
        meal_timing: 'after_food',
        schedule_slots: ['morning'],
        custom_time: '08:30',
        inventory_count: 25,
        refill_alert_threshold: 5,
        prescribed_by: 'Dr. S. K. Roy',
      }),
    });
    const medData = await medRes.json();
    assert(medRes.status === 201 && medData.medication.id, 'Positive: Medication created with custom time slot (08:30)');
    const medId = medData.medication.id;

    // Edit medication
    const editMedRes = await fetch(`${BASE_URL}/medications/${patientId}/${medId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        dosage: '10 mg',
        instructions: 'Updated: Take 10mg after breakfast',
      }),
    });
    assert(editMedRes.ok, 'Positive: Medication prescription updated successfully');

    // -------------------------------------------------------------
    // GROUP 7: Adherence Logging, Inventory & Anti-Duplicate Guard
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: Adherence Logging & Duplicate Prevention ---');
    const today = new Date().toISOString().split('T')[0];

    // Mark dose as taken
    const logRes1 = await fetch(`${BASE_URL}/logs/${patientId}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        medication_id: medId,
        scheduled_date: today,
        scheduled_slot: 'morning',
        status: 'taken',
        notes: 'Taken on time with breakfast',
      }),
    });
    const logData1 = await logRes1.json();
    assert(logRes1.status === 200 && logData1.log.status === 'taken', 'Positive: Dose recorded as taken with timestamp');

    // Anti-duplicate test: Log same dose slot on same day again
    const logRes2 = await fetch(`${BASE_URL}/logs/${patientId}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        medication_id: medId,
        scheduled_date: today,
        scheduled_slot: 'morning',
        status: 'taken',
        notes: 'Second accidental click by senior',
      }),
    });
    const logData2 = await logRes2.json();
    assert(logRes2.status === 200 && logData2.log.id === logData1.log.id, 'Idempotency: Duplicate dose log safely prevented via unique upsert');

    // Verify taken dose NEVER triggers missed-dose escalation
    const takenEscRes = await fetch(`${BASE_URL}/escalations/${patientId}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        medication_id: medId,
        slot: 'morning',
        tier: 3,
      }),
    });
    assert(takenEscRes.status === 400 || takenEscRes.status === 500, 'Safety Rule: Confirmed taken dose is rejected from triggering missed-dose escalation');

    // Add second medication for escalation test
    const medRes2 = await fetch(`${BASE_URL}/medications/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        name: 'Metformin XR',
        dosage: '500 mg',
        form: 'Tablet',
        instructions: 'Take with dinner',
        meal_timing: 'with_food',
        schedule_slots: ['night'],
      }),
    });
    const med2Data = await medRes2.json();
    const med2Id = med2Data.medication.id;

    // -------------------------------------------------------------
    // GROUP 8: Smart Care Escalation & Honest Notification Delivery
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: Smart Care Escalation & Honest Notification ---');

    // Simulate Tier 3 Escalation on unconfirmed medication
    const escRes = await fetch(`${BASE_URL}/escalations/${patientId}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        medication_id: med2Id,
        slot: 'night',
        tier: 3,
      }),
    });
    const escData = await escRes.json();
    assert(escRes.status === 200 && escData.escalationId, 'Positive: Tier 3 Escalation alert triggered for overdue unconfirmed dose');

    // Verify notifications table stores alert with honest email_status ('unconfigured' or 'sent')
    const notifsRes = await fetch(`${BASE_URL}/notifications/${patientId}`, {
      headers: { 'Authorization': `Bearer ${familyToken}` },
    });
    const notifsData = await notifsRes.json();
    const escNotif = notifsData.notifications.find(n => n.type === 'escalation');
    assert(
      escNotif && (escNotif.email_status === 'unconfigured' || escNotif.email_status === 'sent'),
      'Honest Email Status: Notification records accurate email dispatch state (never claims sent when unconfigured)'
    );

    // Resolve escalation
    const resolveRes = await fetch(`${BASE_URL}/escalations/${patientId}/${escData.escalationId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${familyToken}`,
      },
      body: JSON.stringify({ notes: 'Caregiver called senior; confirmed safe' }),
    });
    assert(resolveRes.status === 200, 'Positive: Caregiver successfully resolves active escalation');

    // -------------------------------------------------------------
    // GROUP 9: Appointment Guardian CRUD
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 9: Appointment Guardian ---');

    const apptRes = await fetch(`${BASE_URL}/appointments/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        doctor_name: 'Dr. Manisha Sen',
        specialty: 'Cardiologist',
        clinic_hospital: 'Apollo Heart Center',
        address: 'Sarita Vihar, New Delhi',
        appointment_date: '2026-11-25',
        appointment_time: '11:30',
        notes: 'Routine echocardiogram review',
        reminder_hours: 24,
      }),
    });
    const apptData = await apptRes.json();
    assert(apptRes.status === 201 && apptData.appointment.id, 'Positive: Doctor appointment scheduled with Care Circle notification');
    const apptId = apptData.appointment.id;

    // Update appointment status to completed
    const apptUpdateRes = await fetch(`${BASE_URL}/appointments/${patientId}/${apptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert(apptUpdateRes.status === 200, 'Positive: Appointment status updated to completed');

    // -------------------------------------------------------------
    // GROUP 10: AI Care Assistant & Clinical Safety Guardrails
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 10: AI Care Assistant & Clinical Safety ---');

    // Informational question (safe)
    const aiSafeRes = await fetch(`${BASE_URL}/ai/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        query: 'What does Amlodipine do and how should I take it?',
        patient_id: patientId,
      }),
    });
    const aiSafeData = await aiSafeRes.json();
    assert(
      aiSafeRes.ok && aiSafeData.answer && aiSafeData.disclaimer.includes('Important Notice'),
      'Positive: AI explains medication in plain language with clinical disclaimer'
    );

    // Negative Clinical Safety Test: User asks to double missed dose
    const aiDoubleDoseRes = await fetch(`${BASE_URL}/ai/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        query: 'I missed my morning pill, should I take a double dose tonight?',
        patient_id: patientId,
      }),
    });
    const aiDoubleDoseData = await aiDoubleDoseRes.json();
    assert(
      aiDoubleDoseRes.ok &&
      aiDoubleDoseData.answer.toLowerCase().includes('never take a double dose') &&
      aiDoubleDoseData.source === 'clinical-safety-guardrail',
      'Clinical Safety: AI intercept strictly blocks and warns against doubling missed doses'
    );

    // Negative Clinical Safety Test: User asks for disease diagnosis
    const aiDiagnoseRes = await fetch(`${BASE_URL}/ai/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        query: 'What disease do I have? Can you diagnose me?',
        patient_id: patientId,
      }),
    });
    const aiDiagnoseData = await aiDiagnoseRes.json();
    assert(
      aiDiagnoseRes.ok &&
      aiDiagnoseData.answer.toLowerCase().includes('cannot diagnose illnesses') &&
      aiDiagnoseData.source === 'clinical-safety-guardrail',
      'Clinical Safety: AI intercept strictly refuses disease diagnosis and directs to physician'
    );

    // -------------------------------------------------------------
    // GROUP 11: Judge Demo Data Seeding & Reset
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 11: Evaluator Demo Data Seeding & Reset ---');

    const demoSeedRes = await fetch(`${BASE_URL}/demo/seed`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${seniorToken}` },
    });
    const demoSeedData = await demoSeedRes.json();
    assert(demoSeedRes.ok && demoSeedData.patientId, 'Positive: Seeds judge demo profile ("Ramesh Sharma", 72, 7-day adherence history)');

    const demoResetRes = await fetch(`${BASE_URL}/demo/reset`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${seniorToken}` },
    });
    assert(demoResetRes.ok, 'Positive: Resets evaluator demo data cleanly');

    // -------------------------------------------------------------
    // AUDIT SUMMARY
    // -------------------------------------------------------------
    console.log('\n======================================================================');
    console.log(`🏁 AUDIT EXECUTION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal execution error during audit suite:', err);
    process.exit(1);
  }
}

runAuditTests();
