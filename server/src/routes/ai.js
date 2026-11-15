import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { explainMedication } from '../services/aiService.js';
import { db } from '../db/database.js';

const router = express.Router();

/**
 * AI Care Assistant - Medication Guidance & Explainer
 */
router.post('/explain', requireAuth, async (req, res) => {
  try {
    const { query, patient_id } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    let medicationList = [];
    let patientConditions = '';

    if (patient_id) {
      const patient = db.prepare('SELECT conditions FROM patients WHERE id = ?').get(patient_id);
      if (patient) {
        patientConditions = patient.conditions || '';
      }

      const meds = db.prepare('SELECT name, dosage, instructions, meal_timing FROM medications WHERE patient_id = ? AND is_active = 1').all(patient_id);
      medicationList = meds;
    }

    const explanation = await explainMedication({
      query,
      medicationList,
      patientConditions,
    });

    return res.json(explanation);
  } catch (err) {
    console.error('[AI Assistant Error]:', err);
    return res.status(500).json({ error: 'Failed to process AI explanation request' });
  }
});

export default router;
