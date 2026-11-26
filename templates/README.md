# Unbound Prescription Template Kit

Original, royalty-free templates for **Clinical OS (BD)** — usable in **web**, **desktop (WebView)**, and **mobile (WebView / native forms + HTML PDF)**.

**No vendor SDK. No paid template license. No framework lock-in.**  
Edit HTML, CSS, JSON, and field IDs freely.

## Decision taken (per your approval)

| Choice | Result |
|---|---|
| Paper | **Both A5 (default BD chamber) and A4** |
| Output | **Print/PDF templates + matching in-app form JSON** (better than print-only: one field catalog drives both) |
| Language | **English + Bangla**, user-selectable per prescription (`meta.locale`) |

## Standards basis (public, not copied products)

Built from **public clinical norms**, not cloned commercial UI packs:

1. **WHO** prescription essentials — prescriber identity + registration, date, patient name/age/sex/weight, diagnosis, allergy, drug generic/strength/form, route/dose/frequency/duration/quantity, directions, follow-up  
2. **HL7 FHIR** concepts — `MedicationRequest`, `Patient`, `Practitioner`, `Dosage`, version/status for amendments  
3. **BD chamber practice** — BMDC number, A5 pad, Bangla patient instructions, QR verify, multi-chamber header hooks  

Paid market products were **not copied**. Where competitors show useful *capabilities* (single-page pad, QR, bilingual advice), those capabilities are implemented here as **original layouts**.

## Folder map

```
templates/
  catalog/
    fields.json              # master field list (your control plane)
    templates-index.json     # registry of all templates
  locales/
    en.json / bn.json        # pad + form labels
  schemas/
    prescription.schema.json # payload contract
  forms/                     # in-app UI form templates (unbound JSON)
  print/
    shared/                  # HTML bodies + CSS + vanilla renderer
    a4/ a5/                  # paper-size notes
  samples/
    sample-prescription.json
  preview/
    index.html               # interactive switcher (template / A4|A5 / EN|BN)
```

## Quick preview

```powershell
cd F:\prescription\templates
python -m http.server 8765
```

Open: http://localhost:8765/preview/

Use the toolbar to switch template, paper, language → **Print / PDF**.

## How to control / modify anything

1. **Add a field** → `catalog/fields.json` + `schemas/prescription.schema.json` + locale labels + optional form widget + optional `data-text="..."` in HTML  
2. **Change layout** → edit `print/shared/*.body.html` and `pad.css`  
3. **Change wording** → `locales/en.json` / `locales/bn.json`  
4. **Change form UX** → `forms/*.form.json` (widgets, spans, sections)  
5. **Replace renderer** → delete/replace `render.js`; keep `data-*` hooks or switch to Handlebars/React  

## App integration (same templates everywhere)

### Web
Load CSS + body HTML + `render.js` → `PadRender.mount(el, html, data, labels, { paper, locale })` → `window.print()`.

### Desktop (Electron / Tauri / WebView2)
Embed the same HTML print surface; call print or save PDF via Chromium.

### Mobile
- **Option A (recommended early):** WebView preview using the same HTML, share PDF  
- **Option B:** Bind `forms/*.form.json` to native inputs; still generate PDF from HTML for the legal pad  

## Form templates included

| ID | Purpose |
|---|---|
| `form.general` | Full single-screen Rx workbench |
| `form.pediatric` | Weight/age required + dosing helper hooks |
| `form.chronic` | Re-Rx / continue-all actions |
| `form.assistant_serial` | RBAC-safe serial/fee only (no meds/diagnosis) |

## Print templates included

| ID | Purpose |
|---|---|
| General | Default WHO-aligned pad |
| Pediatric | Weight-emphasized |
| Chronic | Continuing medicines |
| Patient share | No-install patient copy |
| Pharmacy verify | Latest-version authenticity |
| Serial slip | Reception token |

## Legal note

These files are **original project assets** for you to implement and brand.  
Do **not** paste copyrighted artwork, fonts under restrictive licenses, or proprietary template packs into this folder without a proper license.
