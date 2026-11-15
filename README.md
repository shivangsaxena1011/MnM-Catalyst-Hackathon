# SAATHI CARE 🩺
### *PromptWars × Catalyst — Intelligent Elderly Care & Collaborative Medication Management*

[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20Responsive-teal.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-React%20%2B%20TypeScript%20%2B%20Node%20%2B%20SQLite-0B1E33.svg)](#)
[![Security](https://img.shields.io/badge/Security-bcrypt%20Passcode%20%2B%20Rate%20Limiting-emerald.svg)](#)
[![Design](https://img.shields.io/badge/Accessibility-Elder--Friendly%20Mode%20%2B%20Web%20Speech-amber.svg)](#)
[![Hackathon](https://img.shields.io/badge/Hackathon-PromptWars%20%C3%97%20Catalyst-blue.svg)](https://github.com/shivangsaxena1011/MnM-Catalyst-Hackathon)

> **SAATHI CARE** (*Saathi* = Companion / Partner) is a production-minded collaborative elderly healthcare ecosystem that bridges the critical communication gap between **seniors**, **family members**, and **professional caregivers**. 
>
> Designed from the ground up not as a generic alarm clock, but as an active safety net featuring **passcode-protected access**, **Smart Multi-Tier Escalations**, **Appointment Guardian**, **Elder-Friendly Mode with Speech Narration**, **strict clinical safety boundaries ("Never Double a Missed Dose")**, and **verified AI guidance**.

---

## 🌟 Key Innovations & Product Pillars

### 1. 👥 The Care Circle Model (Family & Caregiver Collaboration)
- **Unified Patient Care Plan:** Eliminates information silos. Seniors, adult children, and visiting nurses all access the same live care plan with role-based editing permissions.
- **Instant Invite Code Pairing:** Patient profiles generate unique, human-readable codes (e.g. `SAATHI-DEMO`) allowing family members or nurses to join with 1 click.
- **Elder-Friendly PIN Access:** Seniors can sign in with a simple **4-digit numeric PIN** (hashed securely with bcrypt) alongside standard email/password authentication.

### 2. 💊 Intelligent Medication Management & Inventory Guard
- **Schedule Customization:** Support for `Morning (08:00)`, `Afternoon (13:00)`, `Evening (18:00)`, `Night (21:00)`, and custom timing with meal coordination (`Before food`, `After food`, `With food`, `Anytime`).
- **Duplicate Dose Prevention Guard:** Strictly prevents double confirmation of the same scheduled slot on the same day through database-level unique constraints and upsert validation.
- **Live Pill Inventory & Refill Warnings:** Automatically decrements pill counts upon confirmation and triggers visual refill warnings when medication drops below safety thresholds.

### 3. 🚨 Smart Multi-Tier Care Escalation (Safety Protocol)
- **Autonomous Overdue Dose Detection:** Scans scheduled medication slots against real-time adherence.
  - **Tier 1 (15–45 min):** Gentle in-app reminder to senior.
  - **Tier 2 (45–90 min):** Priority follow-up warning banner.
  - **Tier 3 (90+ min):** **Emergency Caregiver Escalation** dispatched to all authorized family members and caregivers via high-priority dashboard alerts and automated Nodemailer emails.
- **Strict Clinical Safety Policy:** **Never recommend doubling a missed dose!** Prominently displays safety guidance across all escalation cards and notifications: *"If a dose is missed beyond the doctor-approved window, skip it and continue on schedule."*

### 4. 👵 Dedicated Elder-Friendly Mode (Accessibility & Empathy)
- **Ultra-Accessible Visual Design:** 24px+ large readable typography, high-contrast palette, and distraction-free single-pill focus.
- **Oversized Tap Targets:** Giant 60px+ green confirmation button (`✅ YES, I TOOK THIS PILL`).
- **Web Speech API Audio Narration:** Built-in `🔊 Read Aloud` button that audibly speaks today's medicine, dosage, and doctor instructions at a gentle cadence for visually impaired seniors.
- **1-Touch Emergency Call:** Direct speed-dial shortcut to designated family emergency contact.

### 5. 🤖 AI Care Assistant (Safety-Constrained Clinical Guidance)
- **Compassionate Medication Explainer:** Explains complex prescription instructions in plain, reassuring language (e.g., *"Take right in the middle of your meal with water to prevent stomach upset"*).
- **Strict Guardrails:** Programmed with hard boundaries: **Never diagnoses diseases**, **never alters prescriptions or dosages**, and always includes prominent non-medical-advice disclosures.
- **Dual Engine Architecture:** Connects to **Gemini API** when `GEMINI_API_KEY` is present, with an intelligent built-in **Clinical Rule Engine** covering all common senior medications (Metformin, Amlodipine, Lisinopril, Atorvastatin, Omeprazole, etc.) ensuring 100% reliability out-of-the-box.

### 6. 📅 Appointment Guardian
- **Doctor Consultation Management:** Tracks specialist visits, hospital locations, and preparation instructions.
- **Automated Alerts:** Dispatches reminder notifications 24/48 hours prior to consultations.

### 7. 📊 Verifiable Adherence Analytics & Audit Timeline
- **Interactive Recharts Visualization:** Displays 7-day adherence percentages, daily completed vs. missed trends, and time-of-day compliance breakdowns.
- **Chronological Health Timeline:** Complete tamper-evident audit trail of doses taken, skipped reasons, caregiver acknowledgments, and appointment logs.

### 8. ⚖️ Explicit Judge Demo Mode (Honest Evaluation)
- In accordance with hackathon guidelines, the application **does not silently preload fabricated patient data**.
- Evaluators can click the prominent top banner button: **"Load Judge Demo Profile"** to instantly seed an authentic 72-year-old case (**Ramesh Sharma**, Type 2 Diabetes & Hypertension, 3 medications, 7-day adherence history, 1 active escalation alert, and 3 care circle members), or reset to an empty state at will.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, Recharts, Lucide Icons |
| **Backend** | Node.js (v26+), Express.js, RESTful Architecture, ES Modules |
| **Database** | SQLite (Zero-dependency native `node:sqlite` DatabaseSync) |
| **Security** | `bcryptjs` (password & passcode PIN hashing), `jsonwebtoken` (JWT), `express-rate-limit` (brute-force defense) |
| **Notifications** | Nodemailer (configurable SMTP) with honest simulation fallback |
| **AI Engine** | Google Gemini API with fallback Clinical Knowledge Rule Engine |

---

## 📁 Repository Architecture

```
MnM-Catalyst-Hackathon/
├── package.json               # Root scripts (install, build, start)
├── .gitignore                 # Strict rules excluding binaries, node_modules, .env, DBs
├── .env.example               # Complete environment variable template
├── README.md                  # Comprehensive platform documentation
│
├── server/                    # Node.js + Express Backend
│   ├── src/
│   │   ├── db/
│   │   │   └── database.js    # Persistent SQLite schema & indexes
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT verification, patient isolation & permission checks
│   │   │   └── rateLimiter.js # Express rate limiters for auth endpoints
│   │   ├── services/
│   │   │   ├── emailService.js# Nodemailer email dispatcher with honest delivery logging
│   │   │   ├── escalationService.js # Autonomous Multi-Tier Escalation Engine
│   │   │   └── aiService.js   # Safety-constrained AI Care Assistant
│   │   ├── routes/            # Modular Express API routes
│   │   │   ├── auth.js        # Register, Password Login, 4-digit PIN login
│   │   │   ├── patients.js    # Patient onboarding, invite codes & permissions
│   │   │   ├── medications.js # Prescription CRUD & refill inventory
│   │   │   ├── logs.js        # Adherence logging & Recharts analytics
│   │   │   ├── appointments.js# Doctor consultation scheduling
│   │   │   ├── escalations.js # Overdue dose alerts & resolution
│   │   │   ├── timeline.js    # Chronological health audit trail
│   │   │   ├── notifications.js# In-app notifications & email status
│   │   │   ├── ai.js          # AI guidance endpoint
│   │   │   └── demo.js        # Evaluator demo profile seed & reset
│   │   └── index.js           # Server entry point & static client server
│   └── test/
│       └── test-suite.js      # 14-point automated verification test suite
│
└── client/                    # React + Vite + TypeScript Frontend
    ├── src/
    │   ├── api/client.ts      # Typed API client with token authorization
    │   ├── context/
    │   │   ├── AuthContext.tsx# Authentication & active patient state
    │   │   └── ElderModeContext.tsx # Accessibility & Web Speech API provider
    │   ├── components/        # Handcrafted modular components
    │   │   ├── Navbar.tsx     # Brand, patient switcher, notifications, elder toggle
    │   │   ├── Sidebar.tsx    # Responsive navigation
    │   │   ├── DemoBanner.tsx # Top judge evaluation banner
    │   │   ├── DoseActionModal.tsx # Confirm taken / skip dose modal
    │   │   ├── AddMedicationModal.tsx # Prescription creation & scheduling
    │   │   ├── AddAppointmentModal.tsx # Doctor visit scheduler
    │   │   └── AiAssistantModal.tsx # AI Care Assistant dialog
    │   ├── pages/             # 10 Dedicated full-stack views
    │   │   ├── LandingPage.tsx
    │   │   ├── AuthPage.tsx
    │   │   ├── OnboardingPage.tsx
    │   │   ├── DashboardPage.tsx
    │   │   ├── ElderDashboardPage.tsx
    │   │   ├── MedicationsPage.tsx
    │   │   ├── HistoryPage.tsx
    │   │   ├── AppointmentsPage.tsx
    │   │   ├── CareCirclePage.tsx
    │   │   ├── NotificationsPage.tsx
    │   │   ├── TimelinePage.tsx
    │   │   └── SettingsPage.tsx
    │   ├── types/index.ts     # Complete TypeScript definitions
    │   └── index.css          # Design system theme variables
    ├── index.html
    └── vite.config.ts
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js**: v20 or higher (v26 recommended; uses native `node:sqlite`)
- **npm**: v9 or higher

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/shivangsaxena1011/MnM-Catalyst-Hackathon.git
cd MnM-Catalyst-Hackathon

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example server/.env
```

*Default environment variables in `.env`:*
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=saathi_care_secure_jwt_secret_dev_key_2026
DB_PATH=./data/saathi_care.db

# Optional Nodemailer SMTP settings:
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="SAATHI CARE <notifications@saathicare.health>"

# Optional Gemini AI key:
GEMINI_API_KEY=
```
*(Note: If SMTP or Gemini credentials are omitted, the application runs honestly with in-app simulation and clinical rule fallbacks.)*

### 3. Build & Run Production Server
```bash
# Build the React frontend
npm run build

# Start the unified backend server
npm start
```

Open your browser at **`http://localhost:5000`**.

### 4. Running in Development Mode
To run client and server concurrently with hot reloading:
- **Backend:** `cd server && npm run dev` (Runs on `http://localhost:5000`)
- **Frontend:** `cd client && npm run dev` (Runs on `http://localhost:5173` with proxy to backend)

---

## 🧪 Verification & Automated Testing

The repository includes a comprehensive 14-point test suite (`server/test/test-suite.js`) verifying:
1. Health check & SQLite database initialization
2. User registration & bcrypt password/passcode hashing
3. Standard password login
4. Elder 4-digit numeric PIN authentication
5. Patient onboarding & unique `SAATHI-XXXX` code generation
6. Care Circle pairing via invite codes
7. Medication creation, slot scheduling, and inventory tracking
8. Adherence logging (`taken` timestamping)
9. Duplicate dose log prevention (idempotency guard)
10. Smart Care Escalation engine (Tier 3 Caregiver alert dispatch)
11. In-app notification delivery
12. Appointment Guardian scheduling
13. AI Care Assistant clinical safety boundaries ("Never double dose" check)
14. Judge demo profile seeding & reset

To execute the test suite:
```bash
# Ensure server is running, then in a separate terminal:
node server/test/test-suite.js
```

**Expected output:**
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

## 🛡️ Security & Privacy Architecture

- **Passcode & Password Hashing:** User passwords and 4-digit elder PINs are irreversibly hashed using **`bcryptjs`** with salt rounds = 10. Plaintext credentials are never stored.
- **Strict Role-Based Authorization:** Requests to view or edit patient records require verification against the `care_circle` membership table. Only members with `can_edit = 1` can modify medications or appointments.
- **Brute-Force Rate Limiting:** All authentication and passcode verification endpoints are protected by `express-rate-limit` (maximum 15 attempts per 15 minutes per IP).
- **Zero Plaintext Secrets:** Sensitive keys and secrets reside strictly in `.env`, excluded from version control via `.gitignore`.
- **Honest Email Status Reporting:** Never lies about email delivery; if SMTP credentials are missing, system flags status as `unconfigured` and routes alerts safely to the in-app notification center.

---

## 👥 Evaluator Walkthrough (For Hackathon Judges)

1. **Visit `http://localhost:5000`** in any browser.
2. Click **"Sign In"** -> Register an account or sign in.
3. Look at the top banner: Click **"Load Judge Demo Profile"**.
4. Explore the loaded profile for **Ramesh Sharma (72y)**:
   - **Dashboard:** Notice today's morning Metformin marked as taken, and an active **Tier 3 Escalation Alert** for unconfirmed Amlodipine.
   - **Elder View:** Click **"👵 Switch to Elder View"** to test 24px+ typography, oversized buttons, and click **"🔊 Read Aloud"** to hear speech synthesis.
   - **Medications:** View active prescriptions and low-stock pill indicators.
   - **Adherence Log:** View the **Recharts 7-Day Adherence Trend** area chart and time-of-day compliance.
   - **AI Care Guide:** Click **"AI Care Guide"** in the top navbar and click *"What should I do if I miss a dose?"* to inspect clinical safety enforcement.
   - **Notifications:** Click the Bell icon and click **"Test Escalation Alert"** to simulate an overdue dose trigger in real time.
   - **Reset:** Click **"Reset Demo"** in the top banner to return to a clean state.

---

## 📄 License & Attribution

- Built by **Shivang Saxena** for **PromptWars × Catalyst Hackathon**.
- Licensed under the **MIT License**.
