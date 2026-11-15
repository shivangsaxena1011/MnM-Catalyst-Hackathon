<div align="center">

# SAATHI CARE 🩺

**A collaborative care platform that helps elderly people manage their medicines and appointments, and keeps their family and caregivers informed.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-saathi--care--41gq.onrender.com-0D9488?style=for-the-badge&logo=render&logoColor=white)](https://saathi-care-41gq.onrender.com)
[![CI](https://img.shields.io/github/actions/workflow/status/shivangsaxena1011/MnM-Catalyst-Hackathon/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI)](https://github.com/shivangsaxena1011/MnM-Catalyst-Hackathon/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-4F46E5?style=for-the-badge)](LICENSE)

[![React](https://img.shields.io/badge/React%2019-TypeScript-0284C7?style=flat-square&logo=react&logoColor=white)](#technology-stack)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](#technology-stack)
[![SQLite](https://img.shields.io/badge/SQLite-node%3Asqlite-003B57?style=flat-square&logo=sqlite&logoColor=white)](#technology-stack)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Assistant-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)](#technology-stack)

**[🌐 Live Application](https://saathi-care-41gq.onrender.com)** · **[📦 GitHub Repository](https://github.com/shivangsaxena1011/MnM-Catalyst-Hackathon)** · **[✅ CI Runs](https://github.com/shivangsaxena1011/MnM-Catalyst-Hackathon/actions)**

*Built for **PromptWars × Catalyst**, a hackathon by Makers Need More (MnM) and Hack2skill. Challenge: Elderly Care & Medication Management.*

</div>

---

## Table of Contents

1. [The Problem](#the-problem)
2. [Our Solution](#our-solution)
3. [Requirement Coverage](#requirement-coverage)
4. [Key Features](#key-features)
5. [System Architecture](#system-architecture)
6. [Security & Privacy](#security--privacy)
7. [Accessibility](#accessibility)
8. [Performance](#performance)
9. [Quality Assurance](#quality-assurance)
10. [Technology Stack](#technology-stack)
11. [Project Structure](#project-structure)
12. [Evaluator Walkthrough](#evaluator-walkthrough)
13. [Author & License](#author--license)

---

## The Problem

Older adults often take several medicines a day, each on its own schedule. A missed or doubled dose of a blood-pressure, diabetes or heart medicine can be dangerous. Most reminder apps are built for younger users and have three problems:

- **They only notify the user.** If an elderly parent misses a dose, family members living elsewhere never find out.
- **They're hard for seniors to use.** Small text, crowded screens and complicated menus exclude people with low vision or limited tech experience.
- **They don't share information.** The senior, family members and caregivers each keep separate notes, so nobody sees the whole care plan.

## Our Solution

SAATHI CARE (*Saathi* means "companion") gives the senior, their family and their caregivers **one shared care plan**, with the senior in control of their own profile:

- A **Care Circle**. Each senior has a profile that family and caregivers join with a secure invite code, and each member gets view or edit permission.
- **Proactive email reminders** for upcoming doses, missed doses and doctor appointments.
- A **three-tier escalation system**. A gentle nudge to the senior comes first, and family and caregivers are alerted if the dose still isn't confirmed.
- An **Elder Mode** with large text, one medicine at a time, a read-aloud voice and a one-tap emergency call.
- **Clinical safety rules built into the system.** It never suggests doubling a missed dose, and the AI assistant never diagnoses or changes a prescription.

---

## Requirement Coverage

| Challenge Requirement | How SAATHI CARE Delivers It | Source |
| :--- | :--- | :--- |
| Secure, passcode-based access | bcrypt-hashed 4–6 digit PIN login, JWT sessions, rate-limited authentication, cryptographically random invite codes | [`routes/auth.js`](server/src/routes/auth.js) · [`routes/patients.js`](server/src/routes/patients.js) |
| Shared ecosystem for elders, caretakers and family | Care Circle membership with `senior` / `family` / `caregiver` roles and per-member edit rights | [`middleware/auth.js`](server/src/middleware/auth.js) · [`CareCirclePage.tsx`](client/src/pages/CareCirclePage.tsx) |
| View, add, edit and manage medication schedules | Multi-slot schedules (morning / afternoon / evening / night / custom time), meal timing, instructions, pill stock | [`routes/medications.js`](server/src/routes/medications.js) · [`MedicationsPage.tsx`](client/src/pages/MedicationsPage.tsx) |
| Track adherence | Idempotent dose confirmation, skip reasons, 7-day adherence analytics, full activity timeline | [`routes/logs.js`](server/src/routes/logs.js) · [`HistoryPage.tsx`](client/src/pages/HistoryPage.tsx) · [`TimelinePage.tsx`](client/src/pages/TimelinePage.tsx) |
| Monitor upcoming doctor appointments | Appointment tracking with countdowns, preparation notes and status updates | [`routes/appointments.js`](server/src/routes/appointments.js) · [`AppointmentsPage.tsx`](client/src/pages/AppointmentsPage.tsx) |
| Email reminders: missed doses, upcoming doses, appointments | Background scheduler that runs every 10 minutes and sends deduplicated upcoming-dose, appointment and escalation emails | [`services/escalationService.js`](server/src/services/escalationService.js) · [`services/emailService.js`](server/src/services/emailService.js) |
| Go beyond a basic reminder app | Three-tier escalation, safety-limited AI medicine explainer, refill warnings, guest demo | [`services/aiService.js`](server/src/services/aiService.js) · [`routes/escalations.js`](server/src/routes/escalations.js) |
| Keep elders at the centre of their own decisions | Senior-owned profiles, senior-controlled member permissions, dedicated Elder Mode with voice narration | [`ElderDashboardPage.tsx`](client/src/pages/ElderDashboardPage.tsx) · [`ElderModeContext.tsx`](client/src/context/ElderModeContext.tsx) |

---

## Key Features

### 👥 Care Circle
- One live care plan shared by the senior, their family and their caregivers.
- Members join with a human-readable invite code (e.g. `SAATHI-7A8B`). Codes are generated with `crypto.randomInt` and skip look-alike characters (0/O, 1/I).
- Seniors own their profile and decide which members can edit and which can only view.

### 💊 Medication Management
- Flexible schedules with standard slots or custom times, plus meal guidance (before, with or after food).
- **Duplicate-dose protection.** A database-level unique constraint stops the same dose being confirmed twice.
- **Pill inventory.** Confirming a dose updates the stock count, and the app warns when a refill is needed.

### 📧 Proactive Email Reminders
| Reminder | When it is sent | Duplicate guard |
| :--- | :--- | :--- |
| Upcoming dose | Up to 30 minutes before each scheduled dose | `upcoming_dose_reminders` table with a unique constraint |
| Appointment | Within the appointment's reminder window (default 24 hours) | `reminder_sent` flag |
| Missed dose escalation | When a dose is unconfirmed for more than 90 minutes | One escalation per dose per day |

The app reports email delivery honestly. If SMTP isn't configured, notifications still appear in the app, and their email status shows as `unconfigured`, never as sent.

### 🚨 Three-Tier Escalation
| Tier | Time since the scheduled dose | Action |
| :--- | :--- | :--- |
| 1 | 15–45 minutes | Gentle in-app reminder to the senior |
| 2 | 45–90 minutes | High-priority follow-up alert |
| 3 | More than 90 minutes | Critical alert and email to every family member and caregiver |

Every escalation carries the same safety instruction: **never double a missed dose**.

### 👵 Elder Mode
- One medicine at a time, with large type and high contrast.
- An extra-large **"Yes, I took it"** confirmation button.
- **Read Aloud** uses the Web Speech API to speak the medicine name, dose and instructions.
- A one-tap emergency call to the senior's chosen contact.
- Calm by design: no 3D, no background animation and no confetti.

### 🤖 AI Care Assistant
- Explains medicines and instructions in plain, reassuring language.
- **Hard safety limits:** it never diagnoses, never changes a dosage, refuses to suggest doubling a dose, and always shows a "not medical advice" notice.
- Uses Google Gemini when an API key is configured. Otherwise it falls back to a built-in rule engine that covers common medicines for older adults.

### 📅 Appointment Guardian
- Tracks the doctor, specialty, hospital, address, notes and visit status.
- Shows a countdown to the next visit on the dashboard, and the reminder engine emails the whole Care Circle before the visit.

### 📊 Insights & Audit Trail
- An adherence ring, 7-day trend charts and time-of-day breakdowns.
- A timeline of every dose, skip, escalation and appointment event.

### ✨ One-Click Guest Demo
- **"Try Live Demo — no signup"** creates a temporary evaluator account with a realistic case: Ramesh Sharma, 72, with Type 2 diabetes and hypertension, three medicines, seven days of history, an upcoming cardiology visit and an active escalation.
- Each demo gets its own isolated data, so evaluators never see or overwrite each other's changes.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  React 19 + TypeScript SPA (Vite)                            │
│  Pages · Elder Mode · FeedbackProvider · Lazy 3D hero        │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS · JSON · JWT Bearer
┌──────────────────────────────▼───────────────────────────────┐
│  Express API Gateway                                         │
│  Helmet (CSP, HSTS) · CORS allow-list · Rate limiting        │
│  JWT auth · Care Circle access & edit-permission middleware  │
├──────────────┬──────────────────┬────────────────────────────┤
│ REST routes  │ Reminder engine  │ AI Care Assistant          │
│ auth, meds,  │ (10-min cycle)   │ Gemini + rule-based        │
│ logs, appts, │ escalations,     │ fallback, safety intercepts│
│ care circle  │ dose & appt mail │                            │
└──────┬───────┴────────┬─────────┴────────────────────────────┘
       │                │ Nodemailer (SMTP)
┌──────▼────────────────▼──────────────────────────────────────┐
│  SQLite (node:sqlite) · WAL mode · foreign keys · indexes    │
└──────────────────────────────────────────────────────────────┘
```

**Design decisions:**
- **No database server.** Node's built-in SQLite driver keeps deployment simple and dependency-light.
- **Patient isolation is enforced on the server.** Every patient-scoped route checks Care Circle membership before reading or writing data.
- **Reminders run inside the app.** A single scheduled job handles escalations, upcoming-dose emails and appointment emails, and a concurrency guard stops two scans from overlapping.

---

## Security & Privacy

| Area | Implementation |
| :--- | :--- |
| Credentials | Passwords and PINs are hashed with bcrypt. Plain-text credentials are never stored or logged. |
| Sessions | Signed JWT bearer tokens. A strong `JWT_SECRET` is required in production, and the server refuses to start without one. |
| Access control | Care Circle membership is checked on every patient route. Writes require edit permission, and unauthorized requests get HTTP 403. |
| Brute-force defence | Rate limits on login, PIN login and invite-code joining. |
| Invite codes | Generated with a cryptographically secure random number generator. |
| HTTP hardening | Helmet sets a Content-Security-Policy, HSTS and frame protection. CORS only allows exact, configured origins. |
| Input validation | Length, format (date and time) and range checks on medication and appointment inputs. |
| Output safety | All user-supplied values in email templates are HTML-escaped. |
| Honest reporting | Email delivery status is recorded exactly as `sent`, `failed` or `unconfigured`. |

---

## Accessibility

- **Elder Mode:** large type, high contrast, oversized touch targets and voice narration.
- **Accessible feedback:** toasts are announced through an `aria-live` region. Confirmations use a real `role="alertdialog"`: focus starts on the safe choice, Tab stays inside the dialog, Escape cancels, and focus returns where it was afterwards.
- **Semantic markup:** labelled controls, `aria-label`s on icon-only buttons, and status shown with both text and colour, never colour alone.
- **Reduced motion:** heavy animation and the 3D scene are turned off when the user prefers reduced motion or is in Elder Mode.
- **Responsive layout** for phones, tablets and desktops.

---

## Performance

- **Batched background scans.** The reminder engine loads recent dose logs, escalations and sent reminders once per run and checks them in memory, instead of querying once per medicine per slot.
- **Per-run caching.** Care Circle lookups and timezone formatters are cached.
- **Code splitting.** The Three.js hero loads only on the landing page, app pages load on demand, and React, Recharts and Motion are split into separate cacheable bundles.
- **Procedural 3D.** The 3D scene is generated in code and needs no model, texture or video files.
- **Indexed queries** on the hottest lookups (dose logs by patient and date).

---

## Quality Assurance

Every push to `main` is checked by **GitHub Actions** ([`ci.yml`](.github/workflows/ci.yml)), which builds the client and runs all test suites.

| Suite | Tooling | Coverage | Result |
| :--- | :--- | :--- | :--- |
| Server unit tests | `node:test` | Schedule parsing and time resolution, AI safety intercepts, email HTML escaping, input validation, date handling | 22 passing |
| Integration and security audit | Self-starting runner on an isolated temporary database | Auth and PIN login, patient isolation (403s), permissions, medication CRUD, duplicate-dose prevention, escalations, appointments, AI safety, guest demo | 39 passing |
| Client tests | Vitest and Testing Library | Date and error utilities, accessible toast and confirm dialog behaviour | 15 passing |

**Total: 76 automated checks, all passing.**

Code standards:
- Strict TypeScript, with no `any` in the client.
- Shared helpers for schedule logic, dates and error handling.
- JSDoc on service functions.
- Consistent error responses.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| UI & motion | Motion, Three.js with React Three Fiber and Drei, Recharts, Lucide icons |
| Backend | Node.js, Express |
| Database | SQLite via the built-in `node:sqlite` module |
| Auth & security | bcryptjs, jsonwebtoken, Helmet, express-rate-limit |
| Notifications | Nodemailer (SMTP) |
| AI | Google Gemini API with a rule-based safety fallback |
| Testing & CI | node:test, Vitest, Testing Library, GitHub Actions |
| Hosting | Render |
| Built with | Google Antigravity |

---

## Project Structure

```
MnM-Catalyst-Hackathon/
├── client/                     # React + TypeScript frontend
│   └── src/
│       ├── api/                # Typed API client
│       ├── components/         # Modals, navigation, banners
│       │   ├── three/          # Lazy-loaded procedural 3D hero scene
│       │   └── ui/             # Accessible toast & confirm-dialog system
│       ├── context/            # Auth and Elder Mode state
│       ├── pages/              # Landing, dashboard, elder view, medications, etc.
│       ├── types/              # Shared TypeScript models
│       └── utils/              # Date & error helpers (with tests)
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── db/                 # SQLite schema, indexes and migrations
│   │   ├── middleware/         # JWT auth, Care Circle access, rate limiting
│   │   ├── routes/             # REST endpoints
│   │   ├── services/           # Reminder engine, email, AI assistant
│   │   └── utils/              # Shared schedule logic
│   └── test/                   # Unit tests and integration runner
├── .github/workflows/ci.yml    # Continuous integration
├── render.yaml                 # Deployment blueprint
└── LICENSE
```

---

## Evaluator Walkthrough

All steps run on the live deployment, with nothing to install.

1. **Open the app** at **[saathi-care-41gq.onrender.com](https://saathi-care-41gq.onrender.com)**. On the free hosting plan, the first load can take a few seconds while the server wakes up.
2. **Click "✨ Try Live Demo — no signup".** A complete patient case loads straight away.
3. **Dashboard:** look at the adherence ring, today's dose timeline, the active escalation alert, refill warnings and the appointment countdown. Mark a dose as taken.
4. **Elder Mode:** click **"Switch to Elder View"**. Try **Read Aloud** and the large **"Yes, I took it"** button.
5. **AI Care Guide:** ask *"What should I do if I miss a dose?"* and check that it refuses to suggest doubling.
6. **Appointments:** add, update or complete a visit. Each one shows that an email reminder is active.
7. **Care Circle:** see the members, their roles and permissions, and the unique invite code.
8. **Notifications & Timeline:** review the audit trail of escalations, reminders and their email delivery status.

---

## Author & License

**Shivang Saxena**, design and development.
Built for **PromptWars × Catalyst** by Makers Need More (MnM) × Hack2skill.

Released under the [MIT License](LICENSE).

> **Medical disclaimer:** SAATHI CARE supports medication routines and care coordination. It does not provide medical advice, diagnosis or treatment. Always follow the guidance of a qualified doctor or pharmacist.
