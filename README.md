# SAATHI CARE 🩺
### *PromptWars × Catalyst — Intelligent Elderly Healthcare & Collaborative Medication Ecosystem*

[![Live Production](https://img.shields.io/badge/Live%20Production-saathi--care--41gq.onrender.com-14B8A6?style=for-the-badge&logo=render&logoColor=white)](https://saathi-care-41gq.onrender.com)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20Responsive-0F172A?style=for-the-badge)](#)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20%2B%20TypeScript%20%2B%20Node%20%2B%20SQLite-0B1E33?style=for-the-badge)](#)
[![Security](https://img.shields.io/badge/Security-bcrypt%20Passcode%20%2B%20Rate%20Limiting-059669?style=for-the-badge)](#)
[![Design](https://img.shields.io/badge/Accessibility-WCAG%20AA%20%2B%20Web%20Speech%20API-D97706?style=for-the-badge)](#)

---

> 🌐 **Live Application URL:** **[https://saathi-care-41gq.onrender.com](https://saathi-care-41gq.onrender.com)**  
> 🏆 **Built for:** PromptWars × Catalyst Hackathon  
> 📦 **GitHub Repository:** [shivangsaxena1011/MnM-Catalyst-Hackathon](https://github.com/shivangsaxena1011/MnM-Catalyst-Hackathon)

---

## 💡 Executive Summary & Mission

**SAATHI CARE** (*Saathi* = Companion / Partner) is a production-grade, collaborative elderly healthcare ecosystem engineered to bridge the critical safety gap between **seniors**, **family members**, and **professional caregivers**.

Traditional medication apps are built for tech-savvy young adults—they rely on small text, noisy push notifications, and isolated alarm clocks that fail when an elderly parent is confused, resting, or visually impaired. When an elder misses critical cardiac or diabetic medication, isolated alarms do nothing to alert the children living across town.

**SAATHI CARE replaces isolated alarms with an active, collaborative safety net:**
- **Zero-Barrier Elder Experience:** Giant 40px+ typography, high-contrast WCAG AA palette, 84px+ single-tap action buttons, and native **Web Speech API audio narration** that reads instructions aloud.
- **Collaborative Care Circle:** Real-time synchronization between senior, family, and caregiver with role-based editing permissions and 4-digit PIN authentication.
- **Autonomous Multi-Tier Escalations:** Overdue doses automatically escalate from gentle nudges to high-priority family dashboard alerts and automated emergency emails.
- **Appointment Guardian:** Synchronized doctor visit tracker with automated **24-hour advance email reminders**.
- **Upcoming-Dose Early Warning:** Proactive 15-minute advance email reminders ensuring seniors take medications on schedule with food.
- **Clinical AI Care Guide:** Safety-constrained medical explanation powered by Gemini and a deterministic clinical knowledge engine.
- **Clinical Safety Manifesto:** Strict adherence to patient safety: **Never recommend doubling a missed dose!**

---

## 🌟 Core Architectural Innovations

### 1. 👵 Dedicated Elder-Friendly Mode (Accessibility & Empathy)
- **High-Contrast, Distraction-Free Layout:** Switches the entire interface to 40px+ readable typography, warm cream background, and single-card medication focus.
- **84px+ Giant Action Target:** Seniors confirm doses with an unambiguous, oversized `✅ YES, I TOOK THIS PILL` button.
- **Web Speech API Audio Narration:** Built-in `🔊 Read Aloud` button audibly speaks today's medicine name, dosage, and meal instructions (e.g., *"Take 1 tablet after breakfast with warm water"*) at a calm, natural cadence.
- **1-Touch Emergency Speed-Dial:** Direct access button calling the senior's designated primary family contact or emergency services.
- **Zero Cognitive Overload:** Eliminates complex menus, graphs, or nested settings in elder view.

### 2. 👥 The Care Circle Model (Family & Caregiver Collaboration)
- **Unified Patient Care Plan:** Eliminates information silos. Seniors, adult children, and visiting nurses all access the same live care plan.
- **Instant Invite Code Pairing:** Patient profiles generate unique, human-readable codes (e.g. `SAATHI-DEMO`) allowing family members or nurses to join with 1 click.
- **Elder-Friendly 4-Digit PIN Access:** Seniors can sign in with a simple **4-digit numeric PIN** (hashed securely with `bcryptjs`) alongside standard email/password authentication.
- **Granular Permissions:** Role-based access control enforces `can_edit = 1` for care plan modifications while providing read-only access to extended family.

### 3. 🚨 Autonomous 3-Tier Escalation Engine
- **Autonomous Overdue Dose Detection:** A background scheduler continuously monitors scheduled medication slots against live adherence logs.
  - **Tier 1 (15–45 min overdue):** Gentle in-app nudge on senior's dashboard.
  - **Tier 2 (45–90 min overdue):** High-visibility warning banner and family alert.
  - **Tier 3 (90+ min overdue):** **Emergency Caregiver Escalation** dispatched to all authorized family members and caregivers via critical priority dashboard alerts and automated emails.
- **Strict Clinical Safety Policy:** **Never recommend doubling a missed dose!** Prominently displays safety guidance across all escalation cards and notifications: *"If a dose is missed beyond the doctor-approved window, skip it and continue on schedule."*

### 4. 📅 Appointment Guardian & 24h Advance Alerts
- **Specialist Consultation Tracking:** Manages doctor visits, clinic locations, appointment times, and doctor contact numbers.
- **Automated 24-Hour Reminder Engine:** The background daemon scans upcoming appointments and automatically dispatches advance email reminders 24 hours prior to consultations.
- **Deduplication Guard:** Database-level tracking (`reminder_sent = 1`) ensures exactly one reminder is sent per appointment.

### 5. ⏰ Upcoming-Dose Proactive Email Alerts
- **Proactive Schedule Notifications:** Background engine checks for medications scheduled within the next 0–30 minutes and dispatches advance email alerts to seniors and caregivers.
- **Single-Dispatch Assurance:** SQLite table `upcoming_dose_reminders` with a `UNIQUE(patient_id, medication_id, scheduled_date, scheduled_slot)` constraint guarantees zero duplicate emails.

### 6. 💊 Pill Inventory & Refill Guardian
- **Automatic Stock Decrement:** Confirming a dose automatically deducts the pill count in real time.
- **Low-Stock Visual Meter:** Real-time progress bar displaying remaining pills versus safety threshold.
- **Refill Alert Trigger:** Triggers visual warnings and in-app alerts when stock drops below configured thresholds (e.g., `< 7 days supply remaining`).

### 7. 🤖 AI Care Assistant (Safety-Constrained Clinical Guidance)
- **Plain-Language Explanations:** Explains complex prescription instructions in compassionate, easy-to-understand language.
- **Strict Guardrails:** Programmed with hard boundaries: **Never diagnoses diseases**, **never alters prescriptions or dosages**, and always includes prominent non-medical-advice disclosures.
- **Dual Engine Architecture:** Connects to **Gemini API** when configured, paired with a deterministic **Clinical Rule Engine** covering common geriatric medications (Metformin, Amlodipine, Lisinopril, Atorvastatin, Omeprazole, etc.) ensuring 100% reliability.

### 8. 🎨 Immersive 3D Visual Experience
- **Procedural Three.js Hero Scene:** A lightweight, custom procedural 3D scene built with `@react-three/fiber` and `@react-three/drei` featuring a pulsing heart orb (`MeshDistortMaterial`), orbiting two-tone capsules, and particle sparkles.
- **Zero Asset Bloat:** 100% procedural geometry and shaders—no heavy `.gltf` or `.obj` downloads.
- **Dynamic Code-Splitting:** Three.js is lazily loaded via `React.lazy()` + `Suspense`, ensuring the authenticated app remains blazing fast (< 250 KB gzip bundle).

### 9. ⚖️ Interactive Judge Demo Mode (Honest Evaluation)
- In accordance with hackathon evaluation standards, the application **does not silently preload fabricated patient data**.
- Evaluators can click the top banner button: **"Load Judge Demo Profile"** to instantly seed an authentic 72-year-old case (**Ramesh Sharma**, Type 2 Diabetes & Hypertension, 3 medications, 7-day adherence history, 1 active escalation alert, and 3 care circle members), or reset to an empty state at will.

---

## 🛠️ Technology Stack Matrix

| Layer | Technologies | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend UI** | **React 19**, **TypeScript**, **Vite** | Strict typing, instantaneous hot reload, modern component architecture |
| **Styling & Theme** | **Tailwind CSS v4** (`@theme`) | Warm cream palette (`#FFF8F1`), Fraunces serif + Plus Jakarta Sans typography, glassmorphism (`backdrop-blur-md`) |
| **3D Graphics** | **Three.js**, **@react-three/fiber**, **@react-three/drei** | Procedural 3D heart orb, floating capsules, pointer parallax, lazy-loaded chunk |
| **Animation** | **Motion (`motion/react`)**, **Canvas-Confetti** | Spring modal entrances, smooth layout transitions, dose completion confetti burst |
| **Backend API** | **Node.js (v24+)**, **Express.js** | RESTful modular architecture, ES Modules, centralized error handling |
| **Database** | **SQLite (`node:sqlite` DatabaseSync)** | Zero-dependency native SQLite, atomic transactions, persistent storage on Render disk |
| **Security & Auth** | **bcryptjs**, **jsonwebtoken (JWT)** | Salted hashing for passwords & 4-digit PINs, tamper-proof bearer tokens |
| **Rate Limiting** | **express-rate-limit** | Brute-force defense on auth and passcode verification endpoints |
| **Notifications** | **Nodemailer** + Simulated Fallback | Transactional emails for upcoming doses, appointment reminders, and escalations |
| **AI Integration** | **Google Gemini API** + Clinical Rules | Multimodal/generative guidance with strict clinical safety fallback engine |
| **Cloud Hosting** | **Render (Web Service + Persistent Disk)** | Production deployment at `https://saathi-care-41gq.onrender.com` |

---

## 🛡️ Security, Privacy & Compliance Architecture

```
                                  ┌──────────────────────────────┐
                                  │       Client Browser         │
                                  │ (React 19 + TypeScript + 3D) │
                                  └──────────────┬───────────────┘
                                                 │ HTTPS / TLS
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │      Express.js Gateway      │
                                  │  - CORS Allowed Origins      │
                                  │  - Rate Limiter (Brute-Force)│
                                  │  - JWT Bearer Authentication │
                                  └──────────────┬───────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   ▼                             ▼                             ▼
       ┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐
       │   Care Circle Auth    │   │     Escalation Daemon     │   │   AI Safety Shield    │
       │ - bcrypt Salted PINs  │   │ - 10-Min Autonomous Cycle │   │ - Gemini API Guard    │
       │ - Role Permissions    │   │ - Tier 1/2/3 Escalations  │   │ - Never-Double-Dose   │
       │ - Patient Isolation   │   │ - Deduplicated Reminders  │   │ - Clinical Fallback   │
       └───────────┬───────────┘   └─────────────┬─────────────┘   └───────────┬───────────┘
                   │                             │                             │
                   └─────────────────────────────┼─────────────────────────────┘
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │  SQLite Persistent Database  │
                                  │  (Atomic Transactions & WAL) │
                                  └──────────────────────────────┘
```

1. **Passcode & Password Cryptography:** User passwords and senior 4-digit PINs are irreversibly hashed using `bcryptjs` (salt rounds = 10). Plaintext credentials never touch disk or logs.
2. **Strict Multi-Tenant Isolation:** Every patient-specific route verifies the requester's identity against the `care_circle` membership table. Unauthorized users cannot view or modify another patient's care plan.
3. **Role-Based Edit Controls:** Care Circle members are assigned granular privileges (`can_edit = 1` vs read-only). Modifications to prescriptions, schedules, or appointments require edit rights.
4. **Brute-Force Defense:** Express rate limiters protect authentication endpoints against credential stuffing and brute-force PIN guessing.
5. **CORS Hardening:** Production API strictly validates request origins against configured domains and Render production URLs.
6. **Honest Notification Reporting:** The system never fabricates delivery success. When SMTP credentials are unconfigured, emails are transparently flagged as `simulated` in the notification inbox.

---

## 📋 Comprehensive Automated Test Verification

The platform includes an automated 14-point end-to-end verification suite (`server/test/test-suite.js`) validating critical functionality:

```
=============================================================
🧪 RUNNING SAATHI CARE COMPREHENSIVE VERIFICATION TEST SUITE
=============================================================
  ✅ PASS: API health check endpoint is responsive
  ✅ PASS: User registered with hashed password and passcode
  ✅ PASS: Standard password login successful
  ✅ PASS: Elder 4-digit PIN passcode authentication successful
  ✅ PASS: Patient profile created with unique invite code
  ✅ PASS: Family member successfully joined patient Care Circle via invite code
  ✅ PASS: Medication created with daily slot and refill inventory
  ✅ PASS: Medication marked as taken and timestamped
  ✅ PASS: Duplicate dose log safely prevented via unique upsert
  ✅ PASS: Tier 3 Caregiver Escalation alert triggered
  ✅ PASS: Caregiver notification inbox correctly stored escalation alert
  ✅ PASS: Doctor appointment successfully scheduled
  ✅ PASS: AI Care Assistant answered with strict safety boundaries and never-double-dose rule
  ✅ PASS: Judge demo data seeded ("Ramesh Sharma", 72y, 7-day adherence history)
=============================================================
🏁 TEST EXECUTION COMPLETE: 14 PASSED, 0 FAILED
=============================================================
```

---

## 🔍 Hackathon Judge Evaluation Walkthrough

Follow this step-by-step evaluation guide on the live deployment:

### 1. Access the Live Platform
Navigate to **[https://saathi-care-41gq.onrender.com](https://saathi-care-41gq.onrender.com)**.  
*Observe:* The responsive landing page, procedural 3D hero scene with floating medication capsules, animated stats strip, 3-step care workflow, and interactive bento grid.

### 2. Instant 1-Click Guest Demo (Zero Registration)
- Simply click **"✨ Try Live Demo — no signup"** directly on the landing page or on the sign-in screen.
- *Instant Result:* Zero forms to fill. The system instantly initializes a temporary evaluator session and preloads the authentic clinical case for **Ramesh Sharma (72y)** with Type 2 Diabetes & Hypertension, 3 prescribed medications, 7-day adherence history, an upcoming cardiologist appointment, and an active overdue dose escalation alert.
- Alternatively, judges can sign up/sign in normally and click **"Load Judge Demo Profile"** in the evaluation banner at any time.

### 3. Explore the Caregiver Dashboard
- **Adherence Ring:** View the live SVG circular adherence progress ring.
- **Today's Schedule:** Inspect the morning, afternoon, and night slots with pill inventory badges.
- **7-Day Trend Chart:** Explore the Recharts area chart showing daily adherence compliance.
- **Low-Stock Refill Alerts:** View automated pill inventory warning cards.
- **Appointment Countdown:** Inspect the countdown widget for the upcoming Cardiologist consultation.

### 4. Experience the Elder-Friendly Mode
- Click **"👵 Switch to Elder View"** in the top navigation or sidebar.
- *Notice:* The entire interface transforms into a warm, high-contrast, distraction-free card.
- Click **"🔊 Read Aloud"**: Listen to the Web Speech API clearly speak today's medicine, dosage, and instructions.
- Click **"✅ YES, I TOOK THIS PILL"**: Experience the large 84px touch target, instantaneous state confirmation, and celebratory confetti burst.

### 5. Verify Appointment & Upcoming Dose Reminders
- Navigate to **"Appointments"** in the sidebar: Inspect scheduled visits, clinic locations, and the active **"24h Email Alert Active"** indicator badge.
- Schedule a new appointment: Observe automatic email notification dispatch and in-app confirmation.

### 6. Test the AI Care Assistant & Clinical Safety Guardrails
- Click **"AI Care Guide"** in the top navigation bar.
- Click the suggestion chip: *"What should I do if I miss a dose?"*
- *Verify:* The AI strictly enforces the Clinical Safety Manifesto—it clearly instructs the senior **never to double the dose**, to skip it if near the next scheduled time, and to consult their doctor.

### 7. Inspect Care Circle & Notifications
- Navigate to **"Care Circle"**: View the active members (Ramesh Sharma, Priya Sharma, Nurse Ananya) and test copying the invite pass code (`SAATHI-DEMO`).
- Navigate to **"Notifications"**: Inspect the audit log of Tier 3 escalations, appointment reminders, and email dispatch status.

### 8. Reset Demo
- Click **"Reset Demo"** in the top banner at any time to return the platform to a pristine state.

---

## 👥 Authors & Hackathon Attribution

- **Lead Engineer & Architect:** Shivang Saxena
- **Hackathon:** PromptWars × Catalyst Hackathon
- **Repository:** [https://github.com/shivangsaxena1011/MnM-Catalyst-Hackathon](https://github.com/shivangsaxena1011/MnM-Catalyst-Hackathon)
- **License:** MIT License
