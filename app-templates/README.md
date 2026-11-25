# App UI templates (Admin · Frontend · Desktop · Mobile)

You asked for **application UI templates** (admin panel, frontend, desktop, mobile).  
The prescription **print/PDF pad kit** stays separately in `../templates/` (kept as requested).

## What’s here

```
app-templates/
├── admin/
│   ├── adminlte/                 # MIT — industry-standard Bootstrap admin
│   ├── tabler/                   # MIT — modern admin kit (alternative)
│   └── clinical-os-pages/        # Original Clinical OS admin stubs
├── frontend/
│   ├── novena/                   # MIT — medical clinic public/frontend theme
│   └── clinical-os-doctor/       # Original doctor app UI stubs (login, workbench…)
├── desktop/
│   └── electron-shell/           # Legacy stub — use ../../apps/desktop
├── mobile/
│   ├── flutter_healthcare/       # MIT — Flutter healthcare UI reference
│   └── README.md
├── LICENSES.md
└── README.md
```

## Recommended mapping for Clinical OS

| Surface | Use this first | Why |
|---|---|---|
| **Web admin panel** | `admin/adminlte` + `admin/clinical-os-pages` | Full CRUD/dashboard patterns; our stubs show product screens |
| **Modern admin look (alt)** | `admin/tabler` | Cleaner default UI if you prefer Tabler over AdminLTE |
| **Public / marketing frontend** | `frontend/novena` | Medical clinic pages (about, doctors, appointment) |
| **Doctor product frontend** | `frontend/clinical-os-doctor` | Workbench / patients / queue — product-shaped, unbound |
| **Desktop app** | `desktop/electron-shell` | Same web UI in Electron (swap to Tauri later) |
| **Mobile app** | WebView of doctor frontend **or** `mobile/flutter_healthcare` | Fastest MVP = WebView; Flutter kit for native polish |
| **Print/PDF pads** | `../templates/` | A4/A5 EN/BN pads (already built) |

## Quick open (no build)

Doctor UI:
- `frontend/clinical-os-doctor/login.html`
- `frontend/clinical-os-doctor/workbench.html`

Admin stubs:
- `admin/clinical-os-pages/dashboard.html`

## Build upstream kits (optional)

### AdminLTE
```bash
cd app-templates/admin/adminlte
npm install
npm run build
# open dist/index.html or link clinical-os-pages into its layout
```

### Novena
Open `frontend/novena/theme/index.html` (or follow its README `npm` scripts if present). **Replace demo stock photos** before production (image rights may differ from MIT code).

### Desktop
```bash
# Active app (recommended)
cd apps/desktop
npm install
npm run dev

# Legacy minimal shell (optional)
cd app-templates/desktop/electron-shell
npm install
npm start
```

### Mobile (Flutter)
```bash
cd app-templates/mobile/flutter_healthcare
flutter pub get
flutter run
```

## Unbound / no restrictions (project rule)

- All kits are **MIT or original** — modify, strip, rebrand, rewrite.
- No paid SDK binding.
- Prefer extracting only the CSS/layout you need into your real app repo later.
- Desktop/mobile can share one web codebase to avoid maintaining 4 UIs.

## Next integration step (when you say go)

1. Pick **AdminLTE or Tabler** as the admin base (recommend: start AdminLTE, restyle with Clinical OS green `#0b5f4b`).
2. Port `clinical-os-pages` into that kit’s sidebar.
3. Build real doctor app from `clinical-os-doctor` (React/Next or keep HTML+PWA).
4. Wrap with Electron for desktop; Capacitor/Flutter WebView for mobile.
5. Keep feeding Rx output through `templates/` print kit.
