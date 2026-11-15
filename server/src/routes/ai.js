import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { explainMedication } from '../services/aiService.js';
import { db } from '../db/database.js';

const router = express.Router();

/**
 * AI Care Assistant - Medication Guidance & Explainer
 * Enforces patient isolation: Users can only query medical context for patients in their own Care Circle!
 */
router.post('/explain', requireAuth, async (req, res) => {
  try {
    const { query, patient_id } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query text is required' });
    }

    let medicationList = [];
    let patientConditions = '';

    if (patient_id) {
      const numericPatientId = Number(patient_id);
      if (isNaN(numericPatientId) || numericPatientId <= 0) {
        return res.status(400).json({ error: 'Invalid patient_id provided' });
      }

      // Security check: Verify user has active access to this patient profile
      const access = db.prepare(`
        SELECT id FROM care_circle WHERE patient_id = ? AND user_id = ?
      `).get(numericPatientId, req.user.id);

      if (!access) {
        return res.status(403).json({
          error: 'Forbidden: You do not have access to this patient profile context',
        });
      }

      const patient = db.prepare('SELECT conditions FROM patients WHERE id = ?').get(numericPatientId);
      if (patient) {
        patientConditions = patient.conditions || '';
      }

      const meds = db.prepare(`
        SELECT name, dosage, instructions, meal_timing 
        FROM medications 
        WHERE patient_id = ? AND is_active = 1
      `).all(numericPatientId);

      medicationList = meds;
    }

    const explanation = await explainMedication({
      query,
      medicationList,
      patientConditions,
    });

    return res.json(explanation);
  } catch (err) {
    console.error('[AI Assistant Error]:', err.message);
    return res.status(500).json({ error: 'Failed to process AI guidance request' });
  }
});

export default router;
