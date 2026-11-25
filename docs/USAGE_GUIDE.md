# Clinical OS (BD) — Usage Guide

**Tagline:** One Doctor. One Patient Record. Every Chamber.  
**For:** Doctors, receptionists/assistants, patients, pharmacists, and platform admins  

This guide covers **how to use** Clinical OS day to day. For the end-to-end process design, see [`WORKFLOW.md`](./WORKFLOW.md).

> **Demo note:** The current doctor app is an interactive prototype (localStorage + DGDA formulary). Demo OTP is `123456`. Features marked *(planned)* are designed but not fully wired to a backend yet.

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

### 1.1 Who should use what

| You are… | Use |
|---|---|
| Prescribing doctor | **Doctor app** — Workbench, Patients, Queue (desktop or browser) |
| Reception / assistant | **Assistant portal** *(planned)* — serial, fee, vitals only |
| Patient | **Share link / QR / paper pad** — no install |
| Pharmacist | **Verify QR / URL** on the Rx |
| Clinic / platform ops | **Admin pages** — doctors, chambers, drug KB, audit, settings |

### 1.2 Launch the doctor demo (today)

**Desktop (recommended):**

```bash
cd apps/desktop
npm install
npm run dev
```

**Login screen explicitly:**

```powershell
cd apps/desktop
$env:CLINICAL_OS_ENTRY="login"; npm run start
```

**Browser:** open any page under  
`app-templates/frontend/clinical-os-doctor/`  
(e.g. `login.html`).

### 1.3 First sign-in (doctor demo)

1. Open **Sign in**.
2. Enter mobile number (pre-filled in demo) and BM&DC-related fields as shown.
3. Enter OTP **`123456`** → continue.
4. You land in the chamber session with demo doctor **Dr. Ayesha Rahman** (BM&DC A-54321) and active chamber **Green Life Chamber**.

Assistive-software notice on login: final prescribing authority remains with the registered medical practitioner.

### 1.4 Reset demo data

- **Patients** page → **Reset demo data**, or  
- **Login** → **Load demo session**

Restores 12 sample patients, queue serials 44–52, draft/signed Rx, and two chambers.

---

## 2. Doctor

Primary buyer/user. Full clinical chart, prescribing, CDSS, print, and share.

### 2.1 Navigation

Header (always available after login):

| Control | Purpose |
|---|---|
| **Workbench** | Single-screen Rx composer |
| **Patients** | Master patient registry |
| **Queue** | Today’s serial list + vitals |
| Chamber pill | Active chamber name + your BM&DC |
| Sync chip | Online · synced / Offline |
| **Sign out** | Back to login |

### 2.2 Daily chamber routine

1. Confirm **active chamber** on the header pill (pad branding and fees follow this chamber).
2. Open **Queue** — see Waiting / Current / Done.
3. Select the current patient → **Prescribe** / open chart on **Workbench**.
4. Complete Rx → **Sign & print** and/or **Share SMS / QR**.
5. Move to next serial.

### 2.3 Patient registry

**Patients** page:

1. Search by name, mobile, condition, or allergy.
2. Review demographics, allergies, chronic conditions.
3. **Open chart** → Workbench with that patient active.
4. Use **Ctrl/Cmd+K** from anywhere to jump here quickly.

### 2.4 Workbench — prescribe

Layout (one screen):

| Area | What you do |
|---|---|
| Queue sidebar | Jump between today’s patients |
| Patient panel | Confirm identity, allergies, vitals |
| Clinical fields | Chief complaint, diagnosis, advice (EN/BN), follow-up date |
| Medications | Search DGDA formulary → add lines (dose, freq, days, instructions) |
| Prior prescriptions | Review history; load a prior Rx |
| Sign & issue | Sign & print · Share · Re-prescribe last |
| Prescriber | Your name, BM&DC, active chamber address |

**Add a drug**

1. Focus drug search (`/` when not typing in another field).
2. Type brand, generic, or DAR.
3. Optionally filter system: Allopathic (default), Ayurvedic, Herbal, Homeopathic, Unani, All.
4. Select a product → fill dose / frequency / duration / instructions.
5. Watch for **allergy / penicillin-class** (and similar) banners — override only when clinically justified *(overrides logged in production)*.

**Re-prescribe**

- Click **1-click re-prescribe last** to load the last **signed** Rx for this patient.
- If none exists, the app warns you.

**Sign & print**

1. Review lines and CDSS banners.
2. Click **Sign & print** or press **Ctrl+Enter**.
3. Print dialog (browser or Electron native print).
4. Choose pad language / paper before signing when needed (A5 default for BD chambers; A4 supported).

**Share digitally**

1. Click **Share SMS / QR**.
2. Patient receives a link (demo uses a verify-style URL).
3. No patient app install required.

### 2.5 Multi-chamber

- One doctor account → multiple chambers (demo: Green Life active, City Heart available in seed data).
- Switch chamber when that UI control is enabled for your build; Rx remains labeled with `chamberId`.
- Patient history stays unified — do not create duplicate patients per chamber; search by mobile first.

### 2.6 Offline prescribing

1. If sync chip shows **Offline**, continue prescribing and printing locally.
2. Changes queue in the outbox *(production)* until the network returns.
3. Prefer completing **Sign** locally so the pad is never blocked by connectivity.

### 2.7 Safety & compliance (doctor obligations)

- Treat CDSS as **assistance**, not autonomous prescribing (BM&DC).
- Confirm allergies and pregnancy/lactation status verbally when uncertain.
- Prefer generic + strength clarity on the pad.
- When amending a signed Rx, expect a **new version**; tell the patient/pharmacy the previous print may be superseded *(Phase 2 verify)*.

---

## 3. Receptionist / Assistant

Staff role for front desk. **No access to diagnosis, medications, advice, or allergy chart.**

### 3.1 What you can do

| Task | Allowed |
|---|---|
| Search / register patient name, age, sex, phone | Yes |
| Assign visit serial | Yes |
| Record fee | Yes |
| Capture vitals (BP, pulse, …) | Yes |
| Print serial slip | Yes |
| View diagnosis / meds / allergies / clinical notes | **No** |

### 3.2 Check-in steps *(product design; assistant UI portal planned)*

1. Sign in with staff credentials (not the doctor BM&DC owner login).
2. Search patient by mobile → create if new (demographics only).
3. Enter **serial**, **fee**, **vitals**.
4. Patient appears on doctor **Queue** as Waiting.
5. Optionally print **serial slip** for the patient.

Field template reference: `templates/forms/assistant-serial.form.json`.

### 3.3 Using Queue with the doctor (current demo)

Until the dedicated assistant portal ships, chambers can run Queue on a shared doctor station carefully:

1. Open **Queue**.
2. Confirm serial order and vitals shown for each row.
3. Doctor uses **Prescribe** / **Review** — assistants should not open Workbench clinical panels.

### 3.4 Privacy rules (non-negotiable)

- Never ask the doctor to “just leave the workbench open” for fee edits if clinical data is visible — use the assistant surface.
- Do not photograph or share clinical screens.
- Logins are audited (`assistant.login` in admin audit samples).

---

## 4. Patient

No account and **no app install**.

### 4.1 How you receive your prescription

| Channel | What to do |
|---|---|
| **Paper pad** | Keep the printed Rx; show pharmacy |
| **SMS / WhatsApp** | Open the secure link in your phone browser |
| **QR on pad** | Scan with camera → same patient view |

### 4.2 What you see on the digital Rx

- Doctor and chamber identity (BM&DC)
- Your name / age / sex (as recorded)
- Medicine list with dose and timing
- Instructions in **Bangla and/or English**
- Follow-up date (if set)
- QR / link for pharmacy verification

### 4.3 Tips

- If the doctor says the Rx was **updated**, use the newest link or reprint — older paper may be superseded.
- For privacy, do not forward the link publicly; treat it like a medical document.
- Literacy support: prefer Bangla instructions; ask chamber staff to explain timing (e.g. after meals).

---

## 5. Pharmacist

### 5.1 Verify before dispense

1. Scan the **QR** on the pad or patient phone share screen.
2. Confirm:
   - Patient name matches ID / attendant
   - Prescriber BM&DC and chamber
   - Status is **latest signed version** (reject superseded)
3. Dispense against medication lines (generic, strength, form, dose, duration).

### 5.2 If verification fails *(planned production behavior)*

- Do not dispense against an unverifiable or superseded Rx.
- Ask the patient to return to the chamber or open the newest share link.

Demo verify-style URL pattern used in the prototype:  
`https://verify.clinicalos.demo/rx/...`

---

## 6. Platform Admin

Ops console for Clinical OS deployments (HTML stubs under `app-templates/admin/clinical-os-pages/`).

### 6.1 Sidebar map

| Page | Use it to… |
|---|---|
| **Dashboard** | Monitor active doctors, Rx today, offline sync pending, drug KB size |
| **Doctors** | BM&DC registry, chambers count, plan (Free / Pro / Clinic), status |
| **Chambers** | Names, linked doctor, address, hours |
| **Drug KB** | Search/curate DGDA formulary used by doctor clients |
| **Audit logs** | Investigate `rx.sign`, `rx.amend`, `assistant.login`, access |
| **Settings** | Org name, default pad language/paper, SMS/WhatsApp tokens, accent color |

### 6.2 Typical admin tasks

**Onboard a doctor**

1. **Doctors** → add name, BM&DC, contact, plan tier.
2. Create **Chambers** linked to that doctor (address, hours, fee schedule).
3. Confirm doctor can OTP-login and see chambers.

**Publish drug KB update**

1. Open **Drug KB** — search brand/generic/DAR.
2. Coordinate with the ingest pipeline (`scripts/import-dgda-medicines.py`) for bulk refresh.
3. Push versioned offline packs to clients *(production)*.

**Investigate an incident**

1. **Audit logs** → filter by doctor / Rx / time.
2. Confirm who signed or amended; check assistant logins.
3. Escalate clinical disputes to the prescribing doctor — admin does not alter clinical content casually.

**Configure patient messaging**

1. **Settings** → SMS / WhatsApp Business tokens.
2. Set default pad language (EN/BN) and paper (A5/A4).
3. Keep branding accent consistent with chamber pads (`#0b5f4b` default).

---

## 7. Print templates & previews

For design / QA of pads without a live visit:

```powershell
cd F:\prescription\templates
python -m http.server 8765
```

Open `http://localhost:8765/preview/` → switch template, A4/A5, EN/BN → Print / PDF.

| Form / print family | When to use |
|---|---|
| General | Standard adult visit |
| Pediatric | Weight-sensitive peds pad |
| Chronic | Long-term meds / re-Rx style |
| Assistant serial | Front-desk slip only |
| Patient share | Phone-friendly artifact |
| Pharmacy verify | Dispense confirmation surface |

Also see root `VIEW_TEMPLATES.html` for a gallery of UI surfaces.

---

## 8. Desktop app

Electron client wrapping the doctor UI.

| Need | How |
|---|---|
| Dev run | `apps/desktop` → `npm run dev` |
| Windows installer | `npm run dist:win` |
| Native print | File → Print / workbench Sign & print |
| Jump pages | Menu **Navigate**: Sign in, Workbench, Patients, Queue |
| User data folder | Help → Open user data folder |
| Remote web UI later | `$env:CLINICAL_OS_URL="http://localhost:3000"` |

Local folders created on boot:  
`%APPDATA%/clinical-os-desktop/clinical-os/{db,cache,outbox}`

---

## 9. Keyboard cheat sheet

| Shortcut | Context | Action |
|---|---|---|
| `/` | Doctor app (not in an input) | Focus global search (drugs on Workbench, patients on registry) |
| `Ctrl/Cmd+K` | Doctor app | Go to **Patients** |
| `Ctrl+Enter` | Workbench | **Sign & print** |
| `Esc` | Workbench drug search | Clear search |
| `Enter` | Login OTP | Submit |
| `Ctrl+0…3` | Desktop menu Navigate | Sign in / Workbench / Patients / Queue *(Electron)* |

---

## 10. Troubleshooting

| Problem | What to try |
|---|---|
| Invalid OTP | Use demo code **`123456`** |
| Empty / weird patients | **Reset demo data** on Patients or Login |
| Drug search returns nothing | Wait for `dgda-drugs.js` to load; confirm Allopathic/system filter; regenerate via `python scripts/import-dgda-medicines.py` if pack missing |
| Re-prescribe does nothing | Need a prior **signed** Rx for that patient |
| Print looks wrong | Check paper A5 vs A4 and locale EN/BN; use `templates/preview` |
| Sync stuck Offline | Expected in current stub — local prescribe still works; production will drain outbox |
| Assistant can see meds | Should not — use assistant-serial form / portal only; report as RBAC bug |
| Patient link won’t open | Ask chamber to resend share; confirm phone has data; use paper pad as fallback |

---

## Quick role cards

**Doctor** — Queue → Workbench → search drug → CDSS → Sign & print / Share.  
**Assistant** — Find patient → serial + fee + vitals → serial slip. Never open full chart.  
**Patient** — Open SMS/WA/QR or keep paper; follow Bangla instructions; show pharmacy.  
**Pharmacist** — Scan QR → confirm latest version → dispense.  
**Admin** — Doctors & chambers → Drug KB → Audit → messaging settings.

---

## Related docs

| Doc | Purpose |
|---|---|
| [`WORKFLOW.md`](./WORKFLOW.md) | Full clinical/ops workflow |
| [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) | Product & engineering SDP |
| [`../README.md`](../README.md) | Repo overview |
| [`../apps/desktop/README.md`](../apps/desktop/README.md) | Desktop development |
| [`../app-templates/frontend/clinical-os-doctor/README.md`](../app-templates/frontend/clinical-os-doctor/README.md) | Doctor UI technical notes |
