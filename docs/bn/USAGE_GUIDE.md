# Clinical OS (BD) — Usage Guide

**ট্যাগলাইন:** One Doctor. One Patient Record. Every Chamber.  
**কাদের জন্য:** Doctors, receptionists/assistants, patients, pharmacists, platform admins  

এই গাইডে Clinical OS **দৈনন্দিন কীভাবে ব্যবহার করবেন** — সেটা বর্ণনা করা হয়েছে। End-to-end process design-এর জন্য [`WORKFLOW.md`](./WORKFLOW.md) দেখুন।

> **Demo note:** বর্তমান doctor app একটা interactive prototype (localStorage + DGDA formulary)। Demo OTP `123456`। *(planned)* চিহ্নিত ফিচার ডিজাইন আছে কিন্তু backend-এ পুরো wire হয়নি। **ডিফল্ট DB:** native local **PostgreSQL**; Docker optional।

---

## Table of contents

1. [Getting started](#1-getting-started)
2. [Doctor](#2-doctor)
3. [Receptionist / Assistant](#3-receptionist--assistant)
4. [Patient](#4-patient)
5. [Pharmacist](#5-pharmacist)
6. [Platform Admin](#6-platform-admin)
7. [Print templates & previews](#7-print-templates--previews)
8. [Desktop app](#8-desktop-app)
9. [Keyboard cheat sheet](#9-keyboard-cheat-sheet)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Getting started

### 1.1 কে কী ব্যবহার করবেন (Who should use what)

| আপনি… | ব্যবহার করুন |
|---|---|
| Prescribing doctor | **Doctor app** — Workbench, Patients, Queue (desktop বা browser) |
| Reception / assistant | **`apps/web-assistant`** assistant panel — serial, fee, vitals; clinical chart নয় |
| Patient | **Share link / QR / paper pad** — install নেই |
| Pharmacist | Rx-এ **Verify QR / URL** |
| Clinic / platform ops | **Admin pages** — doctors, chambers, drug KB, audit, settings |

### 1.2 Doctor demo চালু করা (আজ)

**Desktop (সুপারিশকৃত):**

```bash
cd apps/desktop
npm install
npm run dev
```

**Login screen স্পষ্টভাবে:**

```powershell
cd apps/desktop
$env:CLINICAL_OS_ENTRY="login"; npm run start
```

**Browser:**  
`app-templates/frontend/clinical-os-doctor/` এর নিচে যেকোনো page (যেমন `login.html`)।

### 1.3 প্রথম sign-in (doctor demo)

1. **Sign in** খুলুন।
2. Mobile number (demo-তে pre-filled) ও BMDC-related field দিন।
3. OTP **`123456`** → continue।
4. Chamber session-এ ঢুকবেন demo doctor **Dr. Ayesha Rahman** (BMDC A-54321), active chamber **Green Life Chamber**।

Login-এ assistive-software notice: চূড়ান্ত prescribing authority নিবন্ধিত medical practitioner-এর।

### 1.4 Demo data reset

- **Patients** page → **Reset demo data**, অথবা  
- **Login** → **Load demo session**

১২ sample patient, queue serial 44–52, draft/signed Rx, দুই chamber ফিরে আসে।

### 1.5 API + panels (foundation)

Native **PostgreSQL** + NestJS API চালু থাকলে role panel JWT দিয়ে API-তে কথা বলে:

```bash
# একবার — docs/LOCAL_SETUP.md
cd apps/api && npm install && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
```

Assistant panel: `cd apps/web-assistant && npm run dev` (reception/queue foundation)।

---

## 2. Doctor

Primary buyer/user। Full clinical chart, prescribing, CDSS, print, share।

### 2.1 Navigation

Login-এর পর header সবসময়:

| Control | কাজ |
|---|---|
| **Workbench** | Single-screen Rx composer |
| **Patients** | Master patient registry |
| **Queue** | আজকের serial list + vitals |
| Chamber pill | Active chamber name + আপনার BMDC |
| Sync chip | Online · synced / Offline |
| **Sign out** | Login-এ ফিরে যান |

### 2.2 দৈনিক chamber routine

1. Header pill-এ **active chamber** নিশ্চিত করুন (pad branding, fee ঐ chamber অনুযায়ী)।
2. **Queue** — Waiting / Current / Done।
3. Current patient বেছে **Prescribe** / **Workbench**-এ chart।
4. Rx শেষ → **Sign & print** ও/বা **Share SMS / QR**।
5. পরের serial।

### 2.3 Patient registry

**Patients** page:

1. Name, mobile, condition, allergy দিয়ে search।
2. Demographics, allergies, chronic conditions review।
3. **Open chart** → Workbench-এ active patient।
4. যেকোনো জায়গা থেকে **Ctrl/Cmd+K** → দ্রুত Patients।

**Allergy chart:** allergy তালিকা **doctor workbench-এ update/maintain করতে হবে**। Assistant portal allergy edit করে না।

### 2.4 Workbench — prescribe

এক স্ক্রিন layout:

| Area | কী করবেন |
|---|---|
| Queue sidebar | আজকের patient-এর মধ্যে jump |
| Patient panel | Identity, allergy, vitals confirm |
| Clinical fields | Chief complaint, diagnosis, advice (EN/BN), follow-up date |
| Medications | DGDA formulary search → line (dose, freq, days, instruction) |
| Prior prescriptions | History; prior Rx load |
| Sign & issue | Sign & print · Share · Re-prescribe last |
| Prescriber | Name, BMDC, active chamber address |

**ওষুধ যোগ**

1. Drug search focus (`/` — অন্য input-এ না থাকলে)।
2. Brand, generic, বা DAR টাইপ।
3. Optional system filter: Allopathic (default), Ayurvedic, Herbal, Homeopathic, Unani, All.
4. Product বেছে dose / frequency / duration / instruction।
5. **Allergy / penicillin-class** (ও অনুরূপ) banner দেখুন — clinical justification থাকলেই override *(production-এ log)*।

API `CLINICAL_OS_API_URL` থাকলে medicine search PostgreSQL ranking ব্যবহার করে। Bulk medicine sync-এর জন্য **TODO(dgda-auto-import)** দেখুন developer doc।

**Favorites (ভবিষ্যৎ):** **TODO** — medicine favorites/recent cache **per-doctor** এবং **discipline-based** হবে; এখন prototype-এ সীমিত।

**Re-prescribe**

- **1-click re-prescribe last** → এই patient-এর শেষ **signed** Rx load।
- না থাকলে warning।

**Sign & print**

1. Line ও CDSS banner review।
2. **Sign & print** বা **Ctrl+Enter**।
3. Print dialog (browser বা Electron native print)।
4. Sign-এর আগে pad language / paper (BD chamber-এ ডিফল্ট A5; A4 supported)।

**Share digitally**

1. **Share SMS / QR**।
2. Patient link পায় (demo-তে verify-style URL)।
3. Patient app install লাগে না।

### 2.5 Multi-chamber

- এক doctor account → একাধিক chamber (demo: Green Life active, City Heart seed-এ)।
- Chamber switch UI build অনুযায়ী; Rx-এ `chamberId` label।
- Patient history unified — chamber প্রতি duplicate patient নয়; আগে mobile দিয়ে search।

### 2.6 Offline prescribing

1. Sync chip **Offline** হলেও locally prescribe ও print চালিয়ে যান।
2. Change outbox-এ queue *(production)* যতক্ষণ network নেই।
3. Connectivity-এর জন্য pad আটকে না রেখে locally **Sign** complete করার চেষ্টা করুন।

### 2.7 Safety & compliance (doctor দায়িত্ব)

- CDSS **assistance**, autonomous prescribing নয় (BMDC)।
- Allergy ও pregnancy/lactation verbally confirm যখন নিশ্চিত নন।
- Pad-এ generic + strength স্পষ্ট রাখুন।
- Signed Rx **amend** করলে **নতুন version**; patient/pharmacy-কে পুরনো print superseded হতে পারে জানান *(Phase 2 verify)*।

---

## 3. Receptionist / Assistant

Front desk staff role। **Diagnosis, medications, advice, বা allergy chart-এ access/edit নেই।**

### 3.1 কী করতে পারবেন

| Task | Allowed |
|---|---|
| Patient name, age, sex, phone search / register | Yes |
| Visit serial দেওয়া | Yes |
| Fee record | Yes |
| Vitals (BP, pulse, …) | Yes |
| Serial slip print | Yes |
| Diagnosis / meds / allergies / clinical notes দেখা বা allergy edit | **No** |

### 3.2 Check-in steps

1. Staff credential দিয়ে sign in (doctor BMDC owner login নয়)।
2. Mobile দিয়ে patient search → নতুন হলে create (শুধু demographics)।
3. **Serial**, **fee**, **vitals** দিন।
4. Doctor **Queue**-তে Waiting।
5. Optional **serial slip** print।

**Panel:** `apps/web-assistant` — assistant/reception foundation; RBAC clinical field বাদ।

Field template: `templates/forms/assistant-serial.form.json`.

### 3.3 Doctor-এর সাথে Queue (বর্তমান demo)

Dedicated assistant portal চালু থাকলে সেটাই ব্যবহার করুন। Interim-এ shared doctor station সাবধানে:

1. **Queue** খুলুন।
2. Serial order ও vitals row অনুযায়ী confirm।
3. Doctor **Prescribe** / **Review** — assistant Workbench clinical panel খুলবে না।

### 3.4 Privacy rules (negotiable নয়)

- Clinical data visible থাকলে fee edit-এর জন্য workbench “খোলা রেখে” দেবেন না — assistant surface ব্যবহার করুন।
- Clinical screen photograph/share করবেন না।
- Login audit হয় (`assistant.login` admin audit sample)।
- **Allergy chart শুধু doctor workbench-এ** — assistant edit করতে পারে না।

---

## 4. Patient

Account নেই, **app install নেই**।

### 4.1 Prescription কীভাবে পাবেন

| Channel | কী করবেন |
|---|---|
| **Paper pad** | Printed Rx রাখুন; pharmacy-তে দেখান |
| **SMS / WhatsApp** | Phone browser-এ secure link খুলুন |
| **Pad-এ QR** | Camera দিয়ে scan → same patient view |

### 4.2 Digital Rx-এ যা দেখবেন

- Doctor ও chamber identity (BMDC)
- Name / age / sex (যেমন record)
- Medicine list — dose, timing
- **Bangla এবং/বা English** instruction
- Follow-up date (থাকলে)
- Pharmacy verification-এর QR / link

### 4.3 Tips

- Doctor বললে Rx **updated**, নতুন link বা reprint — পুরনো paper superseded হতে পারে।
- Privacy: link publicly forward করবেন না; medical document ধরে নিন।
- Bangla instruction prefer; timing (যেমন খাওয়ার পর) staff-কে জিজ্ঞাসা করুন।

---

## 5. Pharmacist

### 5.1 Dispense-এর আগে verify

1. Pad বা patient phone share screen-এ **QR** scan।
2. Confirm:
   - Patient name ID / attendant-এর সাথে মিল
   - Prescriber BMDC ও chamber
   - **Latest signed version** (superseded reject)
3. Medication line অনুযায়ী dispense (generic, strength, form, dose, duration)।

### 5.2 Verification fail *(planned production)*

- Unverifiable বা superseded Rx-এ dispense নয়।
- Patient chamber-এ ফিরে বা newest share link খুলুক।

Demo verify-style URL pattern:  
`https://verify.clinicalos.demo/rx/...`

---

## 6. Platform Admin

Clinical OS deployment ops console (`apps/web-admin`)।

### 6.1 Sidebar map

| Page | কাজ |
|---|---|
| **Dashboard** | Active doctors, Rx today, offline sync pending, drug KB size |
| **Doctors** | BMDC registry, chamber count, plan (Free / Pro / Clinic), status |
| **Chambers** | Name, linked doctor, address, hours |
| **Drug KB** | DGDA formulary search/curate doctor client-এর জন্য |
| **Audit logs** | `rx.sign`, `rx.amend`, `assistant.login`, access |
| **Settings** | Org name, default pad language/paper, SMS/WhatsApp token, accent color |

### 6.2 Typical admin tasks

**Doctor onboard**

1. **Doctors** → name, BMDC, contact, plan tier।
2. **Chambers** create — address, hours, fee schedule।
3. Doctor OTP-login ও chamber দেখছে কিনা confirm।

**Drug KB update publish**

1. **Drug KB** — brand/generic/DAR search।
2. Bulk refresh: `scripts/import-dgda-medicines.py` pipeline।
3. Versioned offline pack client-এ push *(production)*।
4. **TODO(dgda-auto-import):** automated DGDA → Postgres sync ও offline pack refresh (ranking preserve)।

**Incident investigate**

1. **Audit logs** → doctor / Rx / time filter।
2. কে sign/amend; assistant login check।
3. Clinical dispute prescribing doctor-এ escalate — admin casually clinical content বদলায় না।

**Patient messaging configure**

1. **Settings** → SMS / WhatsApp Business token।
2. Default pad language (EN/BN), paper (A5/A4)।
3. Branding accent chamber pad-এর সাথে (`#0b5f4b` default)।

---

## 7. Print templates & previews

লাইভ visit ছাড়া pad design / QA:

```powershell
cd F:\prescription\templates
python -m http.server 8765
```

`http://localhost:8765/preview/` → template, A4/A5, EN/BN → Print / PDF।

| Form / print family | কখন |
|---|---|
| General | Standard adult visit |
| Pediatric | Weight-sensitive peds pad |
| Chronic | Long-term meds / re-Rx style |
| Assistant serial | Front-desk slip only |
| Patient share | Phone-friendly artifact |
| Pharmacy verify | Dispense confirmation surface |

Role panel: `apps/web-*`; doctor UI: `app-templates/frontend/clinical-os-doctor`.

---

## 8. Desktop app

Electron client doctor UI wrap করে।

| Need | How |
|---|---|
| Dev run | `apps/desktop` → `npm run dev` |
| Windows installer | `npm run dist:win` |
| Native print | File → Print / workbench Sign & print |
| Jump pages | Menu **Navigate**: Sign in, Workbench, Patients, Queue |
| User data folder | Help → Open user data folder |
| Remote web UI later | `$env:CLINICAL_OS_URL="http://localhost:3000"` |

Boot-এ তৈরি local folder:  
`%APPDATA%/clinical-os-desktop/clinical-os/{db,cache,outbox}`

---

## 9. Keyboard cheat sheet

| Shortcut | Context | Action |
|---|---|---|
| `/` | Doctor app (input-এ না) | Global search focus (Workbench drug, registry patient) |
| `Ctrl/Cmd+K` | Doctor app | **Patients** |
| `Ctrl+Enter` | Workbench | **Sign & print** |
| `Esc` | Workbench drug search | Search clear |
| `Enter` | Login OTP | Submit |
| `Ctrl+0…3` | Desktop menu Navigate | Sign in / Workbench / Patients / Queue *(Electron)* |

---

## 10. Troubleshooting

| Problem | What to try |
|---|---|
| Invalid OTP | Demo code **`123456`** |
| Empty / weird patients | **Reset demo data** (Patients বা Login) |
| Drug search ফাঁকা | `dgda-drugs.js` load হতে দিন; Allopathic/system filter; pack missing হলে `python scripts/import-dgda-medicines.py` |
| Re-prescribe কাজ করে না | ওই patient-এ prior **signed** Rx লাগে |
| Print ভুল দেখায় | A5 vs A4, locale EN/BN; `templates/preview` |
| Sync Offline আটকে | Stub-এ expected — local prescribe চলে; production outbox drain |
| Assistant meds দেখে | হওয়া উচিত নয় — assistant-serial form / `web-assistant` only; RBAC bug report |
| Assistant allergy edit | **Forbidden by design** — doctor workbench-এ allergy chart |
| Patient link খুলে না | Chamber resend share; phone data; paper pad fallback |

---

## Quick role cards

**Doctor** — Queue → Workbench → drug search → CDSS → Sign & print / Share; allergy chart workbench-এ maintain।  
**Assistant** — Patient খুঁজুন → serial + fee + vitals → serial slip। Full chart / allergy edit নয় (`web-assistant`)।  
**Patient** — SMS/WA/QR বা paper; Bangla instruction follow; pharmacy-তে দেখান।  
**Pharmacist** — QR scan → latest version confirm → dispense।  
**Admin** — Doctors & chambers → Drug KB → Audit → messaging settings.

---

## Related docs

| Doc | Purpose |
|---|---|
| [`WORKFLOW.md`](./WORKFLOW.md) | Full clinical/ops workflow |
| [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) | Product & engineering SDP |
| [`DEVELOPER.md`](./DEVELOPER.md) | Developer handbook |
| [`../README.md`](../README.md) | Repo overview |
| [`../apps/desktop/README.md`](../apps/desktop/README.md) | Desktop development |
| [`../app-templates/frontend/clinical-os-doctor/README.md`](../app-templates/frontend/clinical-os-doctor/README.md) | Doctor UI technical notes |