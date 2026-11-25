# Clinical OS — Doctor frontend

Official chamber UI for the desktop/web doctor client.

| Page | Purpose |
|---|---|
| `login.html` | BM&DC / OTP sign-in (demo OTP `123456`) |
| `workbench.html` | Single-screen Rx composer + DGDA drug search + CDSS allergy checks |
| `patients.html` | Master patient registry + search |
| `queue.html` | Today's serial queue with vitals |

## Drug formulary (DGDA)

Workbench search loads the shared pack:

- `data/dgda-drugs.js` (~50k human-use medicines from Bangladesh DGDA)
- `drug-kb.js` — ranked brand/generic/DAR search helpers

Default filter is **Allopathic**; switch system in the Medications panel for Ayurvedic / Herbal / Homeopathic / Unani.

Regenerate from Excel:

```bash
python scripts/import-dgda-medicines.py
```

## Demo database

`demo-db.js` seeds a local clinical store (localStorage) with:

- 1 doctor + 2 chambers
- 12 patients (allergies, chronic conditions, Bangla names)
- Small demo drug aliases for sample prescriptions
- Today's queue (serials 44–52)
- Draft + signed prescriptions

Live drug search uses the DGDA pack when loaded; demo aliases remain for sample Rx lines.

Reset anytime: **Patients → Reset demo data** or **Login → Load demo session**.

## Scripts

- `shared.css` — clinical design system (IBM Plex Sans, safety colors)
- `app.js` — chrome, toasts, keyboard helpers
- `demo-db.js` — seed + query helpers
- `drug-kb.js` — DGDA formulary API

Open via desktop app (`apps/desktop` → `npm run dev`) or any HTML file in a browser.
