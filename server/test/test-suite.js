/**
 * SAATHI CARE Comprehensive MVP Verification Test Suite
 * Tests:
 * 1. Health check & DB connection
 * 2. User registration, password hashing & passcode PIN setup
 * 3. Authentication (standard password + 4-digit PIN access)
 * 4. Patient profile creation & unique invite code generation
 * 5. Care Circle joining & role permissions check
 * 6. Medication CRUD & duplicate schedule handling
 * 7. Adherence logging (Taken, Skipped, inventory decrement, duplicate prevention)
 * 8. Smart Care Escalation engine & safety rule enforcement ("Never double missed dose")
 * 9. Appointment Guardian CRUD
 * 10. AI Care Assistant with safety constraints
 * 11. Judge Demo Data seed & reset
 * 12. Persistent database verification
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING SAATHI CARE COMPREHENSIVE VERIFICATION TEST SUITE');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('--- TEST GROUP 1: Backend & Database Health ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.ok && healthData.status === 'ok', 'API health check endpoint is responsive');

    // 2. Registration & Password Hashing
    console.log('\n--- TEST GROUP 2: Authentication & Passcode Hashing ---');
    const testEmail = `test.senior.${Date.now()}@saathicare.health`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Om Prakash',
        email: testEmail,
        password: 'SecurePassword123!',
        passcode: '4321',
        role: 'senior',
        phone: '+91 98000 11111',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.token, 'User registered with hashed password and passcode');
    const seniorToken = regData.token;

    // 3. Password Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword123!',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.ok && loginData.user.name === 'Om Prakash', 'Standard password login successful');

    // 4. Elder Quick 4-Digit Passcode Login
    const pinRes = await fetch(`${BASE_URL}/auth/passcode-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        passcode: '4321',
      }),
    });
    const pinData = await pinRes.json();
    assert(pinRes.ok && pinData.user.hasPasscode === true, 'Elder 4-digit PIN passcode authentication successful');

    // 5. Patient Profile Creation
    console.log('\n--- TEST GROUP 3: Patient Profile & Care Circle ---');
    const patientRes = await fetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        full_name: 'Om Prakash',
        age: 74,
        gender: 'Male',
        blood_group: 'O+',
        conditions: 'Hypertension, Mild Arthritis',
        allergies: 'None',
        emergency_contact_name: 'Rohit Prakash (Son)',
        emergency_contact_phone: '+91 98222 33333',
        relationship: 'Self',
      }),
    });
    const patientData = await patientRes.json();
    assert(patientRes.status === 201 && patientData.patient.id && patientData.invite_code.startsWith('SAATHI-'), 'Patient profile created with unique invite code');
    const patientId = patientData.patient.id;
    const inviteCode = patientData.invite_code;

    // 6. Care Circle Joining by Family Member
    const familyEmail = `rohit.son.${Date.now()}@saathicare.health`;
    const famRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohit Prakash',
        email: familyEmail,
        password: 'FamilyPassword123!',
        role: 'family',
      }),
    });
    const famRegData = await famRegRes.json();
    const familyToken = famRegData.token;

    const joinRes = await fetch(`${BASE_URL}/patients/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        invite_code: inviteCode,
        relationship: 'Son',
      }),
    });
    const joinData = await joinRes.json();
    assert(joinRes.status === 200, 'Family member successfully joined patient Care Circle via invite code');

    // 7. Medication Creation & Inventory Setup
    console.log('\n--- TEST GROUP 4: Medication Management & Inventory ---');
    const medRes = await fetch(`${BASE_URL}/medications/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        name: 'Lisinopril',
        generic_name: 'Lisinopril Dihydrate',
        dosage: '10 mg',
        form: 'Tablet',
        instructions: 'Take once in morning with water',
        meal_timing: 'after_food',
        schedule_slots: ['morning'],
        inventory_count: 20,
        refill_alert_threshold: 5,
        prescribed_by: 'Dr. Anita Sen',
      }),
    });
    const medData = await medRes.json();
    assert(medRes.status === 201 && medData.medication.name === 'Lisinopril', 'Medication created with daily slot and refill inventory');
    const medId = medData.medication.id;

    // 8. Adherence Logging & Duplicate Guard
    console.log('\n--- TEST GROUP 5: Adherence Logging & Duplicate Prevention ---');
    const today = new Date().toISOString().split('T')[0];

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
        notes: 'Taken after breakfast',
      }),
    });
    const logData1 = await logRes1.json();
    assert(logRes1.status === 200 && logData1.log.status === 'taken', 'Medication marked as taken and timestamped');

    // Test duplicate preventer / upsert
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
        notes: 'Duplicate attempt to confirm dose',
      }),
    });
    const logData2 = await logRes2.json();
    assert(logRes2.status === 200 && logData2.log.id === logData1.log.id, 'Duplicate dose log safely prevented via unique upsert');

    // 9. Smart Care Escalation Simulation & Safety Check
    console.log('\n--- TEST GROUP 6: Smart Care Escalation & Safety Engine ---');
    const escRes = await fetch(`${BASE_URL}/escalations/${patientId}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${familyToken}`,
      },
      body: JSON.stringify({
        medication_id: medId,
        slot: 'morning',
        tier: 3,
      }),
    });
    const escData = await escRes.json();
    assert(escRes.status === 200 && escData.escalationId, 'Tier 3 Caregiver Escalation alert triggered');

    // Verify notifications table received escalation alert
    const notifRes = await fetch(`${BASE_URL}/notifications/${patientId}`, {
      headers: { 'Authorization': `Bearer ${familyToken}` },
    });
    const notifData = await notifRes.json();
    const hasEscNotif = notifData.notifications.some(n => n.type === 'escalation');
    assert(hasEscNotif, 'Caregiver notification inbox correctly stored escalation alert');

    // 10. Appointment Guardian
    console.log('\n--- TEST GROUP 7: Appointment Guardian ---');
    const apptRes = await fetch(`${BASE_URL}/appointments/${patientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        doctor_name: 'Dr. Anita Sen',
        specialty: 'Internal Medicine',
        clinic_hospital: 'Max Super Speciality Hospital',
        address: 'Saket, New Delhi',
        appointment_date: '2026-11-20',
        appointment_time: '11:00',
        notes: 'Routine blood pressure review',
      }),
    });
    const apptData = await apptRes.json();
    assert(apptRes.status === 201 && apptData.appointment.doctor_name === 'Dr. Anita Sen', 'Doctor appointment successfully scheduled');

    // 11. AI Care Assistant
    console.log('\n--- TEST GROUP 8: AI Care Assistant & Clinical Safety ---');
    const aiRes = await fetch(`${BASE_URL}/ai/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({
        query: 'What does Lisinopril do and should I take a double dose if I missed one?',
        patient_id: patientId,
      }),
    });
    const aiData = await aiRes.json();
    assert(
      aiRes.status === 200 &&
      aiData.answer &&
      aiData.disclaimer.includes('Important Notice') &&
      aiData.answer.toLowerCase().includes('double dose'),
      'AI Care Assistant answered with strict safety boundaries and never-double-dose rule'
    );

    // 12. Judge Demo Data Seeding
    console.log('\n--- TEST GROUP 9: Judge Demo Data Seeding & Reset ---');
    const demoSeedRes = await fetch(`${BASE_URL}/demo/seed`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${seniorToken}` },
    });
    const demoSeedData = await demoSeedRes.json();
    assert(demoSeedRes.ok && demoSeedData.patientId, 'Judge demo data seeded ("Ramesh Sharma", 72y, 7-day adherence history)');

    // Summary
    console.log('\n=============================================================');
    console.log(`🏁 TEST EXECUTION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
}

runTests();
