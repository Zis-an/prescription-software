# App UI templates

Product UI that ships with Clinical OS lives here. Print/PDF pads stay in `../templates/`.

## Layout

```
app-templates/
├── frontend/
│   └── clinical-os-doctor/   # Doctor login, workbench, patients, queue (+ DGDA data)
├── LICENSES.md
└── README.md
```

Vendor admin/marketing/mobile kits (AdminLTE, Tabler, Novena, Flutter) were removed from the repo to keep clones lean. Live admin/assistant/patient/pharmacy UIs are the Vite apps under `apps/web-*`. Desktop shell is `apps/desktop`.

## Quick open

- `frontend/clinical-os-doctor/login.html`
- `frontend/clinical-os-doctor/workbench.html`

## Desktop

```bash
cd apps/desktop
npm install
npm run dev
```
