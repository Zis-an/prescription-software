# Clinical OS (BD) — Full Workflow

**প্রোডাক্ট:** Unified Clinical Practice Platform for Bangladesh  
**ট্যাগলাইন:** One Doctor. One Patient Record. Every Chamber.  
**দর্শক:** Product, engineering, clinic ops, compliance  

এই ডকুমেন্টে প্ল্যাটফর্ম যেসব end-to-end **clinical ও operational workflow** ঘিরে বানানো হয়েছে সেটা বর্ণনা করা হয়েছে। স্ক্রিন ও keyboard shortcut-এর step-by-step নির্দেশের জন্য [`USAGE_GUIDE.md`](./USAGE_GUIDE.md) দেখুন।

---

## 1. Workflow কী optimize করে (What the workflow optimizes for)

| Goal | Workflow কীভাবে সাহায্য করে |
|---|---|
| ~৬০ সেকেন্ডের মধ্যে prescribe | Single-screen workbench, fuzzy drug search, 1-click re-Rx |
| Load-shedding সহ্য করা | Offline-first local store → online হলে background sync |
| Chamber জুড়ে এক chart | Master patient profile; Rx chamber-এ bind কিন্তু history shared |
| Privacy রক্ষা | Assistant শুধু queue/vitals/fees দেখে — full chart নয় |
| App ছাড়া patient reach | Signed Rx-এর SMS / WhatsApp / QR share |
| Prescription বিশ্বাসযোগ্য রাখা | Sign → immutable version, audit trail, pharmacy QR verify |

---

## 2. Workflow-এর actors

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

| Actor | Workflow-এ কোথায় ঢোকে | কী নিয়ে যায় |
|---|---|---|
| **Receptionist / Assistant** | Patient arrival | Serial slip, fee, queue-তে vitals |
| **Doctor** | Queue / patient search | Signed Rx (print + digital share) |
| **Patient** | Share link বা paper pad | Instructions (EN/BN), follow-up date |
| **Pharmacist** | QR / verify URL | Latest Rx version নিশ্চিতকরণ |
| **Platform Admin** | Ops console | Doctors, chambers, drug KB, audit, org settings |
| **Lab partner** *(Phase 2+)* | Report push | Timeline-এ attached observation |

---

## 3. Core visit lifecycle (happy path)

চেম্বারে এক দিনের মূল লুপ:

```
Arrival → Register/Find → Serial + Vitals → Consult → Compose Rx
       → CDSS checks → Sign & Issue → Print / Share → Follow-up
```

### 3.1 Patient arrival

1. Patient চেম্বার reception-এ আসে।
2. Assistant **mobile number** বা **name** দিয়ে search করে।
3. নতুন হলে: demographics দিয়ে patient তৈরি (name, age, sex, phone; Bangla name optional)।
4. চেনা হলে: master profile খোলে (allergy, chronic condition patient-এর সাথে chamber পার হয়ে যায়)।

### 3.2 Queue / serial

1. Assistant আজকের **serial** দেয়, **consultation fee** রেকর্ড করে, **vitals** নেয় (BP, pulse, temp, SpO₂ যা পাওয়া যায়)।
2. Patient status: **Waiting → Current → Done**।
3. Optional: **serial slip** print (`print.a5.serial_slip`) — RBAC-safe (diagnosis, meds, clinical notes নেই)।

### 3.3 Consultation (doctor)

1. Doctor **Queue** খোলে বা active patient নিয়ে সরাসরি **Workbench**।
2. Allergy banner, আগের prescription, chronic meds, শেষ vitals দেখে।
3. **Chief complaint** ও **diagnosis** লেখে।
4. Pad language (EN / BN / bilingual) ও paper (ডিফল্ট A5, optional A4) সেট করে।

### 3.4 Compose prescription

1. **DGDA / DGHS drug knowledge base**-এ fuzzy search (offline cache)।
2. Medication line: dose, frequency, duration, English + Bangla instruction।
3. Optional: শেষ signed Rx বা chronic pack থেকে **1-click re-prescribe**।
4. Specialty / template form field seed করতে পারে (general, pediatric, chronic)।

**TODO:** medicine **favorites** ও recent drugs cache ভবিষ্যতে **প্রতি doctor** এবং **discipline-based** হবে (এখন global/demo স্তরে নয়)।

### 3.5 Clinical decision support (CDSS)

Add-এর সময় (ও sign-এর আগে) সিস্টেম evaluate করে:

- Allergy / same-class conflict (যেমন penicillin-class)
- Duplicate ingredient
- High-severity drug–drug interaction *(Phase 2 depth)*
- Age/weight pediatric helper; pregnancy / renal / hepatic caution *(Phase 2)*

**নিয়ম:** alert শুধু assistive। BMDC-নিবন্ধিত doctor override করতে পারেন; high-severity override log হয়।

**Allergy chart:** **Doctor** workbench-এ patient-এর allergy chart **maintain/update করতে হবে**। **Assistant allergy chart edit বা সম্পূর্ণ allergy detail দেখতে পারবে না** — শুধু demographic, serial, fee, vitals।

### 3.6 Sign & issue

1. Doctor **Sign & print** চাপে (workbench-এ `Ctrl+Enter`)।
2. Rx **signed**; নতুন **version** mint (amend → নতুন version, পুরনো superseded)।
3. Audit event (`rx.sign`)।
4. Local print-এ chamber pad header (doctor name, BMDC, chamber address/fee branding)।
5. পাশাপাশি digital share: SMS / WhatsApp / QR → patient view।

### 3.7 After the visit

| Path | Outcome |
|---|---|
| Paper pad | Patient / attendant A5 (বা A4) print নিয়ে যায় |
| Digital share | Patient link খোলে — instruction, follow-up, app install নেই |
| Pharmacy | QR scan → verify endpoint **latest** version confirm |
| Follow-up | Follow-up date store; reminder / chronic timeline *(Phase 2)* |
| Offline | Network down থাকলে Rx **sync outbox**-এ থাকে ack পর্যন্ত |

---

## 4. Multi-chamber workflow

```
Doctor account
 ├── Chamber A (e.g. Green Life) — pad header, fee ৳800, hours, staff
 └── Chamber B (e.g. City Heart) — আলাদা pad / fee / serial
         │
         └── Same Patient master ID → দুই chamber-এ shared timeline
```

1. Session-এ **active chamber** বেছে নেয় (header chamber pill)।
2. Queue, fee, pad branding ঐ chamber অনুযায়ী।
3. Prescription-এ `chamberId` থাকে কিন্তু patient history unified।
4. Staff account chamber অনুযায়ী scope; clinical chart doctor-only।

---

## 5. Offline ও sync workflow

```
Local write (optimistic) → Local print OK → Outbox queue
        │
        ▼ (when online)
   Sync gateway → Server authoritative Rx version → Ack → Clear outbox
```

নীতি:

1. Client-generated ID দিয়ে **optimistic local write**।
2. Internet ছাড়াই prescribe / save / local print।
3. Sync-এর পর **server owns** Rx version number।
4. Sync status chip: Online · synced / Offline / pending ops।
5. Device-এ PHI encrypted at rest (production target)।

Desktop data root (Phase 0 shell):  
`%APPDATA%/clinical-os-desktop/clinical-os/{db,cache,outbox}`

---

## 6. Role-specific workflows

### 6.1 Doctor (owner)

| Step | Action |
|---|---|
| Onboard | Phone OTP + BMDC registration verify |
| Daily | Chamber বেছে নিন → Queue বা Workbench |
| Prescribe | Compose → CDSS resolve → Sign & print / Share |
| History | Patient খুলে prior Rx timeline → chronic হলে re-Rx |
| Governance | Amend-এ audit; vendor ছাড়তে FHIR/PDF export *(Phase 2)* |

### 6.2 Receptionist / Assistant

| Step | Action |
|---|---|
| Check-in | Patient search / create (শুধু demographics) |
| Queue | Serial, fee, vitals |
| Print | শুধু serial slip |
| **নিষিদ্ধ** | Diagnosis, advice, medications, allergy chart edit/view (full) |

Form contract: `templates/forms/assistant-serial.form.json`  
`forbiddenPaths`: `rx.diagnosis`, `rx.advice`, `medications`, `patient.allergies`

**Panel foundation:** `apps/web-assistant` — assistant/reception panel (queue, serial, vitals, fees); RBAC-এ clinical chart বাইরে।

### 6.3 Patient

| Step | Action |
|---|---|
| Receive | SMS / WhatsApp বা pad-এ QR |
| Open | Browser view — meds, Bangla instruction, follow-up |
| Show pharmacy | QR / verify URL |
| Install? | **কখনো লাগে না** |

### 6.4 Pharmacist

| Step | Action |
|---|---|
| Scan | Pad বা patient share-এ QR |
| Verify | Rx id + **latest version** (superseded reject) |
| Dispense | Verified medication line অনুযায়ী |

### 6.5 Platform / Clinical OS Admin

| Step | Action |
|---|---|
| Doctors | BMDC, plan tier, status |
| Chambers | Address, hours, doctor linkage |
| Drug KB | DGDA formulary release browse/curate offline client-এর জন্য |
| Audit | `rx.sign`, `rx.amend`, `assistant.login`, access events |
| Settings | Org name, default pad language/paper, SMS/WhatsApp token, branding |

### 6.6 Lab partner *(Phase 2+)*

Digital report attach → patient timeline-এ Observation → পরের Rx-এর আগে doctor দেখে।

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

- Draft সম্ভব হলে sync; offline draft হারায় না।
- Amend silently history rewrite করে না — version + audit।

---

## 8. এক visit-এ যে data চলে

| Entity | কে create/update করে | Notes |
|---|---|---|
| **Patient** | Assistant বা Doctor | Chamber জুড়ে master ID |
| **Encounter / Visit** | Assistant (serial) + Doctor (complaint) | Chamber-scoped serial |
| **Observation (vitals)** | Assistant | BP, pulse, temp, SpO₂ |
| **Prescription** | Doctor | `draft` → `signed` (+ version) |
| **MedicationLine** | Doctor | Drug ref, dose, freq, days, EN/BN instruction |
| **AlertEvent** | CDSS | Fired / overridden |
| **ShareLink** | Share-এ system | Signed short token; SMS-এ minimal PII |
| **AuditLog** | System | Immutable |
| **SyncOutbox** | Offline-এ client | Ack পর্যন্ত pending ops |

Print payload contract: `templates/schemas/prescription.schema.json`  
Required: `rx`, `prescriber`, `chamber`, `patient`, `medications`.

---

## 9. Print ও share artifacts

| Artifact | Template ID / surface | ব্যবহারকারী |
|---|---|---|
| General Rx pad | `print` general A5/A4 | Doctor → patient |
| Pediatric / chronic pads | Specialty print templates | Doctor |
| Patient share view | `print.patient_share` | Patient phone |
| Pharmacy verify | `print.pharmacy_verify` | Pharmacist |
| Serial slip | `print.a5.serial_slip` | Assistant → waiting room |

Locales: `meta.locale` দিয়ে English + Bangla। Preview hub: `templates/preview/`.

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

**TODO(dgda-auto-import):** নতুন ওষুধ প্রকাশিত হলে automated DGDA → Postgres `medicines` upsert, offline pack refresh; Super Admin ranking preserve।

UI-তে filterable system: Allopathic (default), Ayurvedic, Herbal, Homeopathic, Unani, All.

---

## 11. Workflow-এর system architecture

```
Doctor PWA / Electron     Assistant portal      Patient / Pharmacy view
        │                        │                         │
        └──────── offline DB ────┘                         │
                 │                                         │
                 ▼                                         ▼
          Sync / API Gateway ◀──────── Auth (OTP + BMDC) + RBAC + Audit
                 │
                 ▼
     Domain: Rx · EHR · Chamber · CDSS · Drug KB · Notify · FHIR I/O
                 │
                 ▼
     Postgres · Object storage · Search · Redis jobs
```

---

## 12. Implementation status (workflow fidelity)

| Workflow piece | Repo-তে আজ | Planned |
|---|---|---|
| Doctor login (demo OTP) | হ্যাঁ (`123456` + API JWT) | Real OTP + BMDC verify |
| Queue + vitals UI | হ্যাঁ (demo DB + `web-assistant` API queue) | Live multi-user polish |
| Workbench compose + DGDA search | হ্যাঁ (local + optional PG ranked search) | Favorites / templates depth (**per-doctor discipline favorites TODO**) |
| Allergy CDSS demo | Partial | Full severity-ranked CDSS |
| Sign & print / share buttons | Demo print + API sign/share/verify | Immutable versions + real SMS/WA |
| Multi-chamber session | Seeded chambers (demo + PG) | Full switch + per-chamber staff |
| Offline sync | Client outbox + `POST /sync/push` + sync chip (flush-এ API চালু লাগে) | Encrypted SQLite + conflict polish |
| Assistant portal | `apps/web-assistant` (RBAC-safe foundation) | Deeper vitals/payments UX |
| Patient / pharmacy verify | `web-patient` / `web-pharmacy` + API | Production SMS/QR delivery |
| Admin ops + Super Admin ranking | `apps/web-admin` + PostgreSQL | Org billing, richer curation |
| PostgreSQL + API / LB readiness | NestJS + optional Compose + k6 harness | PgBouncer, soak tests, multi-AZ |
| Lab attach / FHIR export | Spec + mapping JSON | Phase 2–4 |

Product roadmap phase: root [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) §9–10।

---

## 13. Related docs

| Doc | Purpose |
|---|---|
| [`DEVELOPER.md`](./DEVELOPER.md) | Developer handbook — architecture, modules, DB, tech |
| [`SCALE.md`](./SCALE.md) | 200k-user load-balance readiness |
| [`USAGE_GUIDE.md`](./USAGE_GUIDE.md) | প্রতিটি user type প্রোডাক্ট কীভাবে চালায় |
| [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) | Full SDP — pillars, metrics, backlog |
| [`../app-templates/frontend/clinical-os-doctor/README.md`](../app-templates/frontend/clinical-os-doctor/README.md) | Doctor UI pages |
| [`../templates/README.md`](../templates/README.md) | Print/form kit |
| [`../apps/desktop/README.md`](../apps/desktop/README.md) | Electron client |