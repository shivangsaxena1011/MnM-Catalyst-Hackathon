# SAATHI CARE 🩺
### *Intelligent Elderly Healthcare & Collaborative Medication Ecosystem*

[![Live Platform](https://img.shields.io/badge/Live%20Platform-saathi--care--41gq.onrender.com-0D9488?style=for-the-badge&logo=render&logoColor=white)](https://saathi-care-41gq.onrender.com)
[![CI Status](https://img.shields.io/github/actions/workflow/status/shivangsaxena1011/MnM-Catalyst-Hackathon/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI%20Build%20%26%20Tests)](https://github.com/shivangsaxena1011/MnM-Catalyst-Hackathon/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/Node.js-%3E%3D22.5.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20%7C%20TypeScript%20%7C%20SQLite-0284C7?style=for-the-badge&logo=react&logoColor=white)](#)
[![Accessibility](https://img.shields.io/badge/Accessibility-Accessibility--First%20%2B%20Web%20Speech%20API-D97706?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-4F46E5?style=for-the-badge)](#)

---

> 🌐 **Live Production Application:** **[https://saathi-care-41gq.onrender.com](https://saathi-care-41gq.onrender.com)**  
> 🏆 **Engineered for:** PromptWars × Catalyst Hackathon  
> 👤 **Author & Lead Architect:** Shivang Saxena  
> 📦 **Repository:** [shivangsaxena1011/MnM-Catalyst-Hackathon](https://github.com/shivangsaxena1011/MnM-Catalyst-Hackathon)

---

## 💡 Executive Summary & Clinical Mission

**SAATHI CARE** (*Saathi* = Companion / Lifelong Partner) is an enterprise-grade, collaborative elderly healthcare ecosystem engineered to bridge the critical safety gap between **seniors**, **family members**, and **healthcare providers**.

Traditional medication apps are built for tech-savvy young adults—relying on small typography, noisy push notifications, and isolated alarm clocks that fail when an elderly parent is resting, confused, or visually impaired. When an elder misses a critical cardiac, diabetic, or hypertensive medication dose, isolated alarms do nothing to notify adult children living across town.

**SAATHI CARE replaces isolated alarms with an active, collaborative safety net:**
- **Zero-Barrier Elder Experience:** High-contrast, accessibility-first palette, 40px+ readable typography, 84px single-tap touch targets, and native **Web Speech API audio narration** that clearly reads prescriptions and meal instructions aloud.
- **Collaborative Care Circle:** Real-time synchronization between senior, family, and caregiver with role-based editing permissions (`can_edit = 1` vs read-only) and 4-digit numeric PIN authentication.
- **Autonomous Multi-Tier Escalations:** Overdue doses automatically trigger progressive alerts—from gentle senior dashboard nudges to high-priority family alerts and automated emergency caregiver emails.
- **Appointment Guardian:** Synchronized specialist consultation tracker with automated **24-hour advance email reminders**.
- **Upcoming-Dose Early Warning:** Proactive 15-minute advance email notifications ensuring seniors take medications on schedule with food.
- **Clinical AI Care Guide:** Safety-constrained medical explainer powered by Gemini with deterministic clinical fallback rules.
- **Clinical Safety Manifesto:** Strict adherence to geriatric patient safety: **Never recommend doubling a missed dose.**

---

## 🎯 Challenge Requirement → Implementation Mapping

| Hackathon Requirement | Production Feature Implemented | Codebase & Component Location |
| :--- | :--- | :--- |
| **Secure passcode-based access** | 4–6 digit bcrypt-hashed numeric PIN with brute-force rate limiting + unique Care Circle invite codes | [`server/src/routes/auth.js`](file:///server/src/routes/auth.js), [`server/src/routes/patients.js`](file:///server/src/routes/patients.js), [`client/src/pages/AuthPage.tsx`](file:///client/src/pages/AuthPage.tsx) |
| **Shared ecosystem: elder, caretakers, family** | Care Circle model with granular role-based privileges (`can_edit = 1` vs read-only) & multi-tenant isolation | [`server/src/middleware/auth.js`](file:///server/src/middleware/auth.js), [`client/src/pages/CareCirclePage.tsx`](file:///client/src/pages/CareCirclePage.tsx) |
| **View/add/edit/manage medication schedules** | Prescriptions with multi-slot times (morning/night/custom HH:MM), instructions, meal timing & stock counts | [`server/src/routes/medications.js`](file:///server/src/routes/medications.js), [`client/src/pages/MedicationsPage.tsx`](file:///client/src/pages/MedicationsPage.tsx), [`AddMedicationModal.tsx`](file:///client/src/components/AddMedicationModal.tsx) |
| **Track adherence** | Idempotent daily dose confirmation, skip logging with clinical reasons, SVG adherence ring & 7-day trend chart | [`server/src/routes/logs.js`](file:///server/src/routes/logs.js), [`client/src/pages/HistoryPage.tsx`](file:///client/src/pages/HistoryPage.tsx), [`client/src/pages/DashboardPage.tsx`](file:///client/src/pages/DashboardPage.tsx) |
| **Upcoming doctor appointments** | Appointment Guardian tracking specialty, doctor, clinic/hospital, address, notes, and countdown timer | [`server/src/routes/appointments.js`](file:///server/src/routes/appointments.js), [`client/src/pages/AppointmentsPage.tsx`](file:///client/src/pages/AppointmentsPage.tsx), [`AddAppointmentModal.tsx`](file:///client/src/components/AddAppointmentModal.tsx) |
| **Email reminders: missed doses, upcoming doses, appointments** | 10-minute autonomous background worker dispatching 24h appointment alerts, 15m upcoming dose warnings, and overdue escalations | [`server/src/services/escalationService.js`](file:///server/src/services/escalationService.js), [`server/src/services/emailService.js`](file:///server/src/services/emailService.js), [`server/src/index.js`](file:///server/src/index.js) |
| **Beyond basic reminders** | Autonomous 3-tier caregiver escalation, AI explainer with strict safety guardrails, low-stock refill warning meters, Elder Mode + read-aloud, and 1-click judge demo | [`server/src/services/aiService.js`](file:///server/src/services/aiService.js), [`server/src/routes/demo.js`](file:///server/src/routes/demo.js), [`client/src/pages/ElderDashboardPage.tsx`](file:///client/src/pages/ElderDashboardPage.tsx) |
| **Elder at the centre** | Dedicated high-contrast Elder Mode, Web Speech API audio narration, 84px single-tap buttons, senior-owned profile & member permission control | [`client/src/pages/ElderDashboardPage.tsx`](file:///client/src/pages/ElderDashboardPage.tsx), [`client/src/context/ElderModeContext.tsx`](file:///client/src/context/ElderModeContext.tsx) |

---

## 🌟 Core Architectural Innovations

### 1. 👵 Dedicated Elder-Friendly Mode (Accessibility-First Design)
- **High-Contrast, Distraction-Free Layout:** Transforms the interface to 40px+ readable typography, warm cream background (`#FFF8F1`), and single-card medication focus.
- **84px Giant Action Target:** Seniors confirm doses with an unambiguous, oversized `✅ YES, I TOOK THIS PILL` button.
- **Web Speech API Audio Narration:** Built-in `🔊 Read Aloud` button audibly speaks today's medicine name, dosage, and meal instructions (e.g., *"Take 1 tablet after breakfast with warm water"*) at a calm, natural cadence.
- **1-Touch Emergency Speed-Dial:** Direct access button calling the senior's designated primary family contact or emergency services.
- **Zero Cognitive Overload:** Eliminates complex menus, graphs, or nested settings in elder view.

### 2. 👥 The Care Circle Model (Family & Caregiver Collaboration)
- **Unified Patient Care Plan:** Eliminates information silos. Seniors, adult children, and visiting nurses all access the same live care plan.
- **Instant Invite Code Pairing:** Patient profiles generate unique, human-readable codes (e.g. `SAATHI-7A8B`) generated via `crypto.randomInt` without visually ambiguous characters (`0/O`, `1/I`).
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
- **Dynamic Code-Splitting:** Three.js is lazily loaded via `React.lazy()` + `Suspense`, ensuring the authenticated app remains blazing fast (< 25 KB initial chunk).

### 9. ⚖️ Interactive Judge Demo Mode (Honest Evaluation)
- In accordance with hackathon evaluation standards, the application **does not silently preload fabricated patient data**.
- Evaluators can click the prominent button **"✨ Try Live Demo — no signup"** or use the evaluation banner to instantly seed an authentic clinical case (**Ramesh Sharma, 72y**, Type 2 Diabetes & Hypertension, 3 medications, 7-day adherence history, 1 active escalation alert, and 3 care circle members), or reset to an empty state at will.

---

## 🛠️ Technology Stack Matrix

| Layer | Technologies | Architectural Highlights |
| :--- | :--- | :--- |
| **Frontend UI** | **React 19**, **TypeScript**, **Vite** | Strict typing, instantaneous hot module replacement, zero-`any` codebase |
| **Styling & Theme** | **Tailwind CSS v4** (`@theme`) | Warm cream palette (`#FFF8F1`), Fraunces serif + Plus Jakarta Sans typography, glassmorphism (`backdrop-blur-md`) |
| **3D Graphics** | **Three.js**, **@react-three/fiber**, **@react-three/drei** | Procedural 3D heart orb, floating capsules, pointer parallax, lazily chunked |
| **Animation & Feedback** | **Motion (`motion/react`)**, **Canvas-Confetti**, **FeedbackProvider** | Spring modal entrances, confetti burst on dose completion, accessible alertdialog & toasts |
| **Backend API** | **Node.js (v24+)**, **Express.js** | RESTful modular architecture, ES Modules, Helmet CSP, centralized error handling |
| **Database** | **SQLite (`node:sqlite` DatabaseSync)** | Zero-dependency native SQLite, atomic transactions (ephemeral on free tier; demo data seeded on demand) |
| **Security & Auth** | **bcryptjs**, **jsonwebtoken (JWT)** | Salted hashing for passwords & 4-digit PINs, tamper-proof bearer tokens |
| **Rate Limiting** | **express-rate-limit** | Brute-force defense on auth and passcode verification endpoints |
| **Notifications** | **Nodemailer** + Simulated Fallback | Transactional emails for upcoming doses, appointment reminders, and escalations |
| **AI Integration** | **Google Gemini API** + Clinical Rules | Multimodal/generative guidance with strict clinical safety fallback engine |
| **Cloud Hosting** | **Render (Web Service)** | Production deployment at `https://saathi-care-41gq.onrender.com` |

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
                                  │  - CORS Origin Whitelist     │
                                  │  - Rate Limiter (Brute-Force)│
                                  │  - Helmet Security & CSP     │
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
2. **Strict Multi-Tenant Isolation:** Every patient-specific route verifies the requester's identity against the `care_circle` membership table. Unauthorized users cannot view or modify another patient's care plan (HTTP 403 Forbidden).
3. **Role-Based Edit Controls:** Care Circle members are assigned granular privileges (`can_edit = 1` vs read-only). Modifications to prescriptions, schedules, or appointments require edit rights.
4. **Brute-Force Defense:** Express rate limiters protect authentication endpoints against credential stuffing and brute-force PIN guessing.
5. **CORS & CSP Hardening:** Production API strictly validates request origins against configured domains and Render production URLs, backed by Helmet Content Security Policy headers.
6. **XSS Protection & HTML Escaping:** All transactional email templates run through HTML entity escaping (`escapeHtml()`) to guarantee immunization against injection attacks.
7. **Honest Notification Reporting:** The system never fabricates delivery success. When SMTP credentials are unconfigured, emails are transparently flagged as `simulated` in the notification inbox.

---

## 📋 Comprehensive Automated Test Verification

SAATHI CARE features a comprehensive, multi-tiered test verification suite covering unit logic, security constraints, and full end-to-end integration flows. Every commit is continuously validated via **GitHub Actions CI**.

```
======================================================================
🛡️  SAATHI CARE: COMPREHENSIVE AUTOMATED VERIFICATION SUITE
======================================================================

▶ Server Unit Tests (node:test)
  ✔ AI Care Assistant Safety Intercepts (double-dose & diagnosis refusals)
  ✔ Client Date Helper (SQLite CURRENT_TIMESTAMP to UTC conversions)
  ✔ Email HTML Escaping & XSS Sanitization
  ✔ Schedule Utilities (Slot parsing & custom time resolution)
  ✔ Input Validation Constraints (Lengths, regex, non-negative stock)
  ℹ 22 passed, 0 failed

▶ E2E Integration & Security Audit (self-starting runner on temp SQLite DB)
  ✔ Core System & DB Health (Health check endpoint responsive)
  ✔ Registration & Strict Role/PIN Validation (Zero hash leakage, 409 conflicts)
  ✔ Authentication & Passcode Security (Password & 4-digit PIN authentication)
  ✔ Patient Profile & Care Circle Pairing (Unique invite code generation)
  ✔ Patient Isolation & Permission Enforcement (403 Forbidden checks)
  ✔ Medication CRUD & Custom Timings (Prescription lifecycles)
  ✔ Adherence Logging & Duplicate Prevention (Idempotent upserts)
  ✔ Smart Care Escalation & Honest Notification (Tier 3 alerts, honest email status)
  ✔ Appointment Guardian (Scheduling, updates, 24h reminders)
  ✔ AI Care Assistant & Clinical Safety (Never-double-dose safety enforcement)
  ✔ Evaluator Demo Data Seeding & Reset (1-Click guest demo & clean reset)
  ℹ 39 passed, 0 failed

▶ Client Component & Utility Tests (Vitest + Testing Library)
  ✔ Date parser utilities (5 tests)
  ✔ Type-safe error message extraction (4 tests)
  ✔ Accessible FeedbackProvider (alertdialog, focus trap, escape key, focus restore) (6 tests)
  ℹ 15 passed, 0 failed

======================================================================
🏁 TOTAL VERIFICATION METRIC: 76 PASSED, 0 FAILED (100% SUCCESS RATE)
======================================================================
```

---

## 🔍 Hackathon Judge Evaluation Walkthrough

Follow this step-by-step evaluation guide on the live deployment:

### 1. Access the Live Platform
Navigate to **[https://saathi-care-41gq.onrender.com](https://saathi-care-41gq.onrender.com)**.  
*Observe:* The responsive landing page, procedural 3D hero scene with floating medication capsules, animated stats strip, 3-step care workflow, and interactive bento grid.

### 2. Instant 1-Click Guest Demo (Zero Registration Required)
- Simply click **"✨ Try Live Demo — no signup"** directly on the landing page or on the sign-in screen.
- *Instant Result:* Zero registration forms to fill. The system instantly initializes a temporary evaluator session and preloads the authentic clinical case for **Ramesh Sharma (72y)** with Type 2 Diabetes & Hypertension, 3 prescribed medications, 7-day adherence history, an upcoming cardiologist appointment, and an active overdue dose escalation alert.
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
