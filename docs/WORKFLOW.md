# Clinical OS (BD) — Full Workflow

**Product:** Unified Clinical Practice Platform for Bangladesh  
**Tagline:** One Doctor. One Patient Record. Every Chamber.  
**Audience:** Product, engineering, clinic ops, compliance  

This document describes the end-to-end clinical and operational workflows the platform is designed around. For step-by-step screens and keyboard shortcuts, see [`USAGE_GUIDE.md`](./USAGE_GUIDE.md).

---

## 1. What the workflow optimizes for

| Goal | How the workflow supports it |
|---|---|
| Prescribe in under ~60 seconds | Single-screen workbench, fuzzy drug search, 1-click re-Rx |
| Survive load-shedding | Offline-first local store → background sync when online |
| One chart across chambers | Master patient profile; Rx tied to chamber but history is shared |
| Protect privacy | Assistants see queue/vitals/fees only — never full chart |
| Reach patients without an app | SMS / WhatsApp / QR share of the signed Rx |
| Keep prescriptions trustworthy | Sign → immutable versions, audit trail, pharmacy QR verify |

---

## 2. Actors in the workflow

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Receptionist │────▶│ Doctor (owner)  │────▶│   Patient    │
│ / Assistant  │     │ Workbench + EHR │     │ SMS/WA/QR    │
└──────────────┘     └────────┬────────┘     └──────┬───────┘
                              │                     │
                              ▼                     ▼
                     ┌─────────────────┐     ┌──────────────┐
                     │ Platform Admin  │     │  Pharmacist  │
                     │ Drug KB · Audit │     │ Verify latest│
                     └─────────────────┘     └──────────────┘
```

| Actor | Enters workflow at | Leaves with |
|---|---|---|
| **Receptionist / Assistant** | Patient arrival | Serial slip, fee, vitals on queue |
| **Doctor** | Queue / patient search | Signed Rx (print + digital share) |
| **Patient** | Share link or paper pad | Instructions (EN/BN), follow-up date |
| **Pharmacist** | QR / verify URL | Confirmation of latest Rx version |
| **Platform Admin** | Ops console | Doctors, chambers, drug KB, audit, org settings |
| **Lab partner** *(Phase 2+)* | Report push | Attached observation on timeline |

---

## 3. Core visit lifecycle (happy path)

The primary chamber-day loop:

```
Arrival → Register/Find → Serial + Vitals → Consult → Compose Rx
       → CDSS checks → Sign & Issue → Print / Share → Follow-up
```

### 3.1 Patient arrival

1. Patient presents at chamber reception.
2. Assistant searches by **mobile number** or **name**.
3. If new: create patient with demographics (name, age, sex, phone; Bangla name optional).
4. If known: open master profile (allergies, chronic conditions travel with the patient across chambers).

### 3.2 Queue / serial

1. Assistant assigns today’s **serial**, records **consultation fee**, captures **vitals** (BP, pulse, temp, SpO₂ as available).
2. Patient status moves: **Waiting → Current → Done**.
3. Optional: print **serial slip** (`print.a5.serial_slip`) — RBAC-safe (no diagnosis, meds, or clinical notes).

### 3.3 Consultation (doctor)

1. Doctor opens **Queue** or jumps to **Workbench** with the active patient.
2. Reviews allergy banner, prior prescriptions, chronic meds, last vitals.
3. Records **chief complaint** and **diagnosis**.
4. Sets pad language (EN / BN / bilingual) and paper (A5 default, A4 optional).

### 3.4 Compose prescription

1. Fuzzy search against the **DGDA / DGHS drug knowledge base** (offline cache).
2. Add medication lines: dose, frequency, duration, English + Bangla instructions.
3. Optional: **1-click re-prescribe** from last signed Rx or chronic pack.
4. Specialty / template forms may seed fields (general, pediatric, chronic).

### 3.5 Clinical decision support (CDSS)

On add (and before sign), the system evaluates:

- Allergy / same-class conflicts (e.g. penicillin-class)
- Duplicate ingredients
- High-severity drug–drug interactions *(Phase 2 depth)*
- Age/weight pediatric helpers; pregnancy / renal / hepatic cautions *(Phase 2)*

**Rule:** alerts are assistive. The BM&DC-registered doctor may override; high-severity overrides are logged.

### 3.6 Sign & issue

1. Doctor presses **Sign & print** (or `Ctrl+Enter` on workbench).
2. Rx becomes **signed**; a new **version** is minted (amendments create a new version and supersede the old).
3. Audit event recorded (`rx.sign`).
4. Local print uses chamber pad header (doctor name, BM&DC, chamber address/fee branding).
5. Parallel digital share: SMS / WhatsApp / QR deep link to patient view.

### 3.7 After the visit

| Path | Outcome |
|---|---|
| Paper pad | Patient / attendant takes A5 (or A4) print |
| Digital share | Patient opens link — instructions, follow-up, no app install |
| Pharmacy | Scans QR → verify endpoint confirms **latest** version |
| Follow-up | Follow-up date stored; reminders / chronic timeline *(Phase 2)* |
| Offline | If network was down, Rx stays in sync **outbox** until ack |

---

## 4. Multi-chamber workflow

```
Doctor account
 ├── Chamber A (e.g. Green Life) — pad header, fee ৳800, hours, staff
 └── Chamber B (e.g. City Heart) — separate pad / fee / serials
         │
         └── Same Patient master ID → shared timeline across both
```

1. Doctor selects **active chamber** for the session (header chamber pill).
2. Queue, fees, and pad branding use that chamber.
3. Prescriptions store `chamberId` but patient history remains unified.
4. Staff accounts are scoped per chamber where configured; clinical chart remains doctor-only.

---

## 5. Offline & sync workflow

```
Local write (optimistic) → Local print OK → Outbox queue
        │
        ▼ (when online)
   Sync gateway → Server authoritative Rx version → Ack → Clear outbox
```

Principles:

1. **Optimistic local writes** with client-generated IDs.
2. Full prescribe / save / local print works without internet.
3. **Server owns** Rx version numbers after sync.
4. Sync status chip shows Online · synced / Offline / pending ops.
5. PHI encrypted at rest on device (production target).

Desktop data roots (Phase 0 shell):  
`%APPDATA%/clinical-os-desktop/clinical-os/{db,cache,outbox}`

---

## 6. Role-specific workflows

### 6.1 Doctor (owner)

| Step | Action |
|---|---|
| Onboard | Phone OTP + BM&DC registration verify |
| Daily | Select chamber → open Queue or Workbench |
| Prescribe | Compose → resolve CDSS → Sign & print / Share |
| History | Open patient → prior Rx timeline → re-Rx if chronic |
| Governance | Review audit when amending; export FHIR/PDF when leaving vendor *(Phase 2)* |

### 6.2 Receptionist / Assistant

| Step | Action |
|---|---|
| Check-in | Search / create patient (demographics only) |
| Queue | Assign serial, fee, vitals |
| Print | Serial slip only |
| **Forbidden** | Diagnosis, advice, medications, allergy chart details |

Form contract: `templates/forms/assistant-serial.form.json`  
`forbiddenPaths`: `rx.diagnosis`, `rx.advice`, `medications`, `patient.allergies`

### 6.3 Patient

| Step | Action |
|---|---|
| Receive | SMS / WhatsApp message or QR on pad |
| Open | Browser view — meds, Bangla instructions, follow-up |
| Show pharmacy | QR / verify URL |
| Install? | **Never required** |

### 6.4 Pharmacist

| Step | Action |
|---|---|
| Scan | QR on pad or patient share |
| Verify | Confirm Rx id + **latest version** (reject superseded) |
| Dispense | Against verified medication lines |

### 6.5 Platform / Clinical OS Admin

| Step | Action |
|---|---|
| Doctors | Registry by BM&DC, plan tier, status |
| Chambers | Addresses, hours, doctor linkage |
| Drug KB | Browse / curate DGDA formulary releases for offline clients |
| Audit | `rx.sign`, `rx.amend`, `assistant.login`, access events |
| Settings | Org name, default pad language/paper, SMS/WhatsApp tokens, branding |

### 6.6 Lab partner *(Phase 2+)*

Digital report attach → Observation on patient timeline → doctor sees before next Rx.

---

## 7. Prescription state machine

```
        ┌─────────┐
        │  draft  │◀── workbench edits (local)
        └────┬────┘
             │ Sign
             ▼
        ┌─────────┐
        │ signed  │──▶ print + share + pharmacy verify
        └────┬────┘
             │ Amend
             ▼
   new version (signed) + previous marked superseded
```

- Drafts sync when possible; never lose offline drafts.
- Amendments do not silently rewrite history — version + audit.

---

## 8. Data that moves through a visit

| Entity | Created / updated by | Notes |
|---|---|---|
| **Patient** | Assistant or Doctor | Master ID across chambers |
| **Encounter / Visit** | Assistant (serial) + Doctor (complaint) | Chamber-scoped serial |
| **Observation (vitals)** | Assistant | BP, pulse, temp, SpO₂ |
| **Prescription** | Doctor | `draft` → `signed` (+ version) |
| **MedicationLine** | Doctor | Drug ref, dose, freq, days, EN/BN instruction |
| **AlertEvent** | CDSS | Fired / overridden |
| **ShareLink** | System on share | Signed short token; minimal PII in SMS |
| **AuditLog** | System | Immutable |
| **SyncOutbox** | Client when offline | Pending ops until ack |

Print payload contract: `templates/schemas/prescription.schema.json`  
Required: `rx`, `prescriber`, `chamber`, `patient`, `medications`.

---

## 9. Print & share artifacts

| Artifact | Template ID / surface | Who uses it |
|---|---|---|
| General Rx pad | `print` general A5/A4 | Doctor → patient |
| Pediatric / chronic pads | Specialty print templates | Doctor |
| Patient share view | `print.patient_share` | Patient phone |
| Pharmacy verify | `print.pharmacy_verify` | Pharmacist |
| Serial slip | `print.a5.serial_slip` | Assistant → waiting room |

Locales: English + Bangla via `meta.locale`. Preview hub: `templates/preview/`.

---

## 10. Drug knowledge workflow

```
DGDA/DGHS source list
    → scripts/import-dgda-medicines.py
    → dgda-drugs.js (~49k human medicines)
    → Offline cache on doctor client
    → Workbench fuzzy search (brand / generic / DAR)
    → Admin Drug KB curation for releases
```

Systems filterable in UI: Allopathic (default), Ayurvedic, Herbal, Homeopathic, Unani, All.

---

## 11. System architecture of the workflow

```
Doctor PWA / Electron     Assistant portal      Patient / Pharmacy view
        │                        │                         │
        └──────── offline DB ────┘                         │
                 │                                         │
                 ▼                                         ▼
          Sync / API Gateway ◀──────── Auth (OTP + BM&DC) + RBAC + Audit
                 │
                 ▼
     Domain: Rx · EHR · Chamber · CDSS · Drug KB · Notify · FHIR I/O
                 │
                 ▼
     Postgres · Object storage · Search · Redis jobs
```

---

## 12. Implementation status (workflow fidelity)

| Workflow piece | In repo today | Planned |
|---|---|---|
| Doctor login (demo OTP) | Yes (`123456` + API JWT) | Real OTP + BM&DC verify |
| Queue + vitals UI | Yes (demo DB + `web-assistant` API queue) | Live multi-user polish |
| Workbench compose + DGDA search | Yes (local + optional PG ranked search) | Favorites / templates depth |
| Allergy CDSS demo | Partial | Full severity-ranked CDSS |
| Sign & print / share buttons | Demo print + API sign/share/verify | Immutable versions + real SMS/WA |
| Multi-chamber session | Seeded chambers (demo + PG) | Full switch + per-chamber staff |
| Offline sync | Client outbox + `POST /sync/push` + sync chip (API must be up to flush) | Encrypted SQLite + conflict polish |
| Assistant portal | `apps/web-assistant` (RBAC-safe) | Deeper vitals/payments UX |
| Patient / pharmacy verify | `web-patient` / `web-pharmacy` + API | Production SMS/QR delivery |
| Admin ops + Super Admin ranking | `apps/web-admin` + PostgreSQL | Org billing, richer curation |
| PostgreSQL + API / LB readiness | NestJS + Compose + k6 harness | PgBouncer, soak tests, multi-AZ |
| Lab attach / FHIR export | Spec + mapping JSON | Phase 2–4 |

Product roadmap phases: see root [`DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) §9–10.

---

## 13. Related docs

| Doc | Purpose |
|---|---|
| [`DEVELOPER.md`](./DEVELOPER.md) | Developer handbook — architecture, modules, DB, tech |
| [`SCALE.md`](./SCALE.md) | 200k-user load-balance readiness |
| [`USAGE_GUIDE.md`](./USAGE_GUIDE.md) | How each user type operates the product |
| [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) | Full SDP — pillars, metrics, backlog |
| [`../app-templates/frontend/clinical-os-doctor/README.md`](../app-templates/frontend/clinical-os-doctor/README.md) | Doctor UI pages |
| [`../templates/README.md`](../templates/README.md) | Print/form kit |
| [`../apps/desktop/README.md`](../apps/desktop/README.md) | Electron client |
