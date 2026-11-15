/**
 * AI Care Assistant Service
 * Provides compassionate, plain-language explanations of medication instructions.
 * Strictly adheres to clinical safety:
 * - NEVER diagnoses diseases.
 * - NEVER recommends changing dosage or altering prescriptions.
 * - ALWAYS warns against doubling missed doses.
 * - Always includes safety disclaimers.
 * - Dual engine: Uses Gemini API when GEMINI_API_KEY is configured,
 *   otherwise falls back to a comprehensive clinical rule-based knowledge engine.
 */

const SAFETY_DISCLAIMER = "⚠️ Important Notice: This information is for educational and supportive purposes only. It is NOT medical advice. Never change your dosage, stop taking a medicine, or start a new treatment without speaking directly to your doctor or pharmacist.";

// Clinical Knowledge Base for common senior medications (Fallback Engine)
const CLINICAL_KNOWLEDGE_BASE = {
  metformin: {
    name: "Metformin",
    purpose: "Helps manage blood sugar levels in Type 2 Diabetes by helping your body respond better to insulin.",
    bestTime: "Usually taken with meals (breakfast and/or dinner) to minimize mild stomach upset.",
    comfortTip: "Drink a full glass of water. If you feel slightly nauseous initially, taking it right in the middle of your meal often helps.",
    caution: "Do not skip meals while taking this medicine unless advised by your doctor.",
  },
  amlodipine: {
    name: "Amlodipine",
    purpose: "Relaxes and widens your blood vessels so your heart can pump blood more easily and keep blood pressure healthy.",
    bestTime: "Can be taken morning or evening, but it is best to take it at the same exact time every day.",
    comfortTip: "When getting up from a bed or chair, take your time and stand slowly to avoid feeling lightheaded.",
    caution: "Avoid eating grapefruit or drinking grapefruit juice in large quantities as it can affect blood pressure medicine.",
  },
  atorvastatin: {
    name: "Atorvastatin (Lipitor)",
    purpose: "Helps lower LDL ('bad') cholesterol and protects your heart and blood vessels.",
    bestTime: "Most commonly taken in the evening or at bedtime, with or without food.",
    comfortTip: "Consistency matters more than food timing. Taking it with dinner or right before bed is usually easiest to remember.",
    caution: "Contact your doctor if you experience unexplained muscle pain or tenderness.",
  },
  lisinopril: {
    name: "Lisinopril",
    purpose: "Protects your kidneys and lowers blood pressure by helping tight blood vessels relax.",
    bestTime: "Often prescribed in the morning. Take it with a glass of water.",
    comfortTip: "Stay hydrated. Avoid salt substitutes containing potassium unless approved by your physician.",
    caution: "If you develop a persistent, dry tickly cough, let your doctor know so they can evaluate an alternative.",
  },
  omeprazole: {
    name: "Omeprazole (Prilosec)",
    purpose: "Reduces excess stomach acid to prevent heartburn, acid reflux, or stomach irritation from other medications.",
    bestTime: "Take it 30 to 60 minutes before your first meal of the day (usually breakfast).",
    comfortTip: "Swallow the capsule whole with water—do not crush or chew it.",
    caution: "Works best when taken before food rather than after.",
  },
  aspirin: {
    name: "Aspirin (Low Dose 75mg / 81mg)",
    purpose: "Helps prevent blood clots and protects heart health.",
    bestTime: "Always take with food or immediately after a meal to protect your stomach lining.",
    comfortTip: "Drinking a full glass of water helps ensure it passes smoothly into the stomach.",
    caution: "Avoid taking extra painkillers like Ibuprofen or Naproxen without checking with your doctor first.",
  },
  losartan: {
    name: "Losartan",
    purpose: "Lowers high blood pressure and helps protect the kidneys, especially for individuals with diabetes.",
    bestTime: "Can be taken in the morning or evening. Pick one time and stay consistent.",
    comfortTip: "Stand up gradually after sitting or lying down.",
    caution: "Avoid excessive potassium supplements or salt substitutes unless instructed by your physician.",
  },
  levothyroxine: {
    name: "Levothyroxine",
    purpose: "Replaces missing thyroid hormone to keep your energy, metabolism, and body temperature balanced.",
    bestTime: "Take first thing in the morning on an empty stomach with a full glass of water, at least 30-60 minutes before breakfast.",
    comfortTip: "Wait at least 4 hours before taking calcium or iron supplements, as they block absorption.",
    caution: "Take only with plain water—not coffee, tea, or juice.",
  },
};

/**
 * Explains medication instructions in plain, compassionate language for seniors and families.
 * Strictly adheres to clinical safety: pre-emptively intercepts and refuses double-dose queries,
 * dosage adjustments, emergency symptoms, and medical diagnoses.
 * 
 * @param {Object} params
 * @param {string} params.query - The user's question or prompt
 * @param {Array<{name: string, dosage?: string, instructions?: string}>} [params.medicationList=[]] - Active medication regimen
 * @param {string} [params.patientConditions=''] - Clinical conditions for contextual advice
 * @returns {Promise<{source: string, answer: string, disclaimer: string}>}
 */
export async function explainMedication({ query, medicationList = [], patientConditions = '' }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const trimmedQuery = (query || '').trim();
  const qLower = trimmedQuery.toLowerCase();

  // 1. HARD MEDICAL SAFETY GUARDRAILS (Pre-execution intercept)
  // Check for dosage alteration or doubling missed dose attempts
  if (
    qLower.includes('change dose') ||
    qLower.includes('double dose') ||
    qLower.includes('double up') ||
    qLower.includes('take 2 pills') ||
    qLower.includes('take two pills') ||
    qLower.includes('increase dose') ||
    qLower.includes('decrease dose') ||
    qLower.includes('stop taking') ||
    qLower.includes('prescribe me') ||
    qLower.includes('alter dosage')
  ) {
    return {
      source: 'clinical-safety-guardrail',
      answer: `🛡️ **Clinical Safety Protocol:** 

Only your prescribing physician or licensed doctor can safely adjust your medication dosages or modify your prescription.

**Critical Safety Rule for Missed Doses:**
- **NEVER take a double dose** to make up for a missed pill. Taking extra medication can cause dangerous drops in blood pressure, hypoglycemia, or drug toxicity.
- If you forgot a dose and it is close to your next scheduled time, skip the forgotten dose and continue with your normal schedule.
- Please call your doctor's clinic or speak directly with your pharmacist for specific clinical guidance.`,
      disclaimer: SAFETY_DISCLAIMER,
    };
  }

  // Check for emergency medical symptoms
  if (
    qLower.includes('chest pain') ||
    qLower.includes('shortness of breath') ||
    qLower.includes('heart attack') ||
    qLower.includes('stroke') ||
    qLower.includes('difficulty breathing') ||
    qLower.includes('severe bleeding') ||
    qLower.includes('unconscious')
  ) {
    return {
      source: 'clinical-safety-guardrail',
      answer: `🚨 **EMERGENCY MEDICAL WARNING:**

If you or your loved one are experiencing acute symptoms such as chest pressure, shortness of breath, sudden numbness, or dizziness, **do not wait for an app or online response**. 

**Please call emergency medical services immediately (e.g. 112 / 911 / 102) or go to the nearest hospital emergency room.** Notify an emergency contact from your Care Circle now.`,
      disclaimer: SAFETY_DISCLAIMER,
    };
  }

  // Check for disease diagnosis inquiries
  if (
    qLower.includes('diagnose me') ||
    qLower.includes('what disease do i have') ||
    qLower.includes('do i have cancer') ||
    qLower.includes('what is wrong with me')
  ) {
    return {
      source: 'clinical-safety-guardrail',
      answer: `🛡️ **Medical Disclaimer:** 

SAATHI CARE cannot diagnose illnesses or clinical conditions. Only a licensed physician can perform physical examinations, order diagnostic tests, and make medical diagnoses. Please schedule an appointment with your doctor.`,
      disclaimer: SAFETY_DISCLAIMER,
    };
  }

  // 2. Gemini API Engine (when key is configured)
  if (apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are SAATHI CARE's warm, compassionate, and highly cautious AI Assistant for seniors and their families.
Your mission is to explain existing medication routines, schedules, and general wellness tips in simple, soothing, easy-to-understand language.

STRICT MEDICAL SAFETY RULES:
1. NEVER diagnose any disease or medical condition.
2. NEVER prescribe, change, add, or alter any medication, dose, or frequency.
3. NEVER tell a patient to stop taking their prescribed medicine.
4. If a missed dose is mentioned, remind them NEVER to double the next dose.
5. Always advise the user to contact their doctor or pharmacist for any clinical decisions.

Patient Context:
- Current Medications: ${JSON.stringify(medicationList)}
- Known Health Conditions: ${patientConditions || 'None specified'}

User Question: "${trimmedQuery}"

Provide a warm, reassuring answer in plain language (short paragraphs, bullet points if needed). Keep it friendly and clear for an elder.`,
            }],
          }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          return {
            source: 'gemini',
            answer: candidate,
            disclaimer: SAFETY_DISCLAIMER,
          };
        }
      }
    } catch (err) {
      console.warn('[AIService] Gemini API request failed, switching to clinical rule engine:', err.message);
    }
  }

  // 3. Fallback Rule-Based Knowledge Engine
  let matchedMed = null;
  for (const [key, info] of Object.entries(CLINICAL_KNOWLEDGE_BASE)) {
    if (qLower.includes(key) || qLower.includes(info.name.toLowerCase())) {
      matchedMed = info;
      break;
    }
  }

  if (matchedMed) {
    return {
      source: 'rule-engine',
      answer: `### 💊 About ${matchedMed.name}

- **What it does:** ${matchedMed.purpose}
- **Best time to take it:** ${matchedMed.bestTime}
- **Comfort & Ease Tip:** ${matchedMed.comfortTip}
- **Helpful Caution:** ${matchedMed.caution}`,
      disclaimer: SAFETY_DISCLAIMER,
    };
  }

  // Generic helpful senior-care explanation if no specific drug matched
  return {
    source: 'rule-engine',
    answer: `Here is general guidance for your daily medications:

- **Routine & Consistency:** Taking your medicines at the same time every day (with breakfast, lunch, or dinner) builds a strong habit and keeps levels steady in your body.
- **Hydration:** Always take tablets and capsules with a full glass of plain room-temperature water.
- **If You Miss a Dose:** Never take two doses together. If it is almost time for your next dose, skip the missed one and continue your normal schedule.
- **Need specific help?** Try asking about specific medicines like *"Tell me about Metformin"*, *"When should I take Amlodipine?"*, or *"How should I take Omeprazole?"*`,
    disclaimer: SAFETY_DISCLAIMER,
  };
}
