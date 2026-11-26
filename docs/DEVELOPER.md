# Clinical OS (BD) — Developer Handbook

**Audience:** Engineers working in this repository  
**Product:** Unified Clinical Practice Platform for Bangladesh  
**Tagline:** One Doctor. One Patient Record. Every Chamber.  
**Status:** Phase 0 foundation — NestJS/PostgreSQL API + multi-role panels + Electron doctor prototype  
**Last reviewed:** 2026-11-26  

> **Keep this document current.** After any meaningful change (new module, DB wiring, IPC, schema, dependency, or runtime path), update the narrative sections below **and** run `python scripts/sync-developer-doc.py`. Cursor agents are instructed to do this automatically via `.cursor/rules/update-developer-doc.mdc`.

Related docs:

| Doc | Purpose |
|---|---|
| [`DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) | Product SDP — pillars, roadmap, proposed stack |
| [`LOCAL_SETUP.md`](./LOCAL_SETUP.md) | Native PostgreSQL setup (Docker not required) |
| [`BRANCHING.md`](./BRANCHING.md) | Git branches, panel slices, `demo/*` tags |
| [`bn/README.md`](./bn/README.md) | বাংলা handbook set (মিশ্র বাংলা–ইংরেজি) |
| [`SCALE.md`](./SCALE.md) | Load-balance readiness (optional Compose) |
| [`WORKFLOW.md`](./WORKFLOW.md) | Clinical / operational workflows |
| [`USAGE_GUIDE.md`](./USAGE_GUIDE.md) | How each user type uses the product |
| [`apps/api/README.md`](../apps/api/README.md) | API + seed accounts |
| [`apps/desktop/README.md`](../apps/desktop/README.md) | Desktop app quick start |
| [`templates/README.md`](../templates/README.md) | Print/PDF pad kit |
| [`app-templates/README.md`](../app-templates/README.md) | UI kits & stubs map |

---

## 1. What this project is

Clinical OS is an **offline-first clinical practice platform** aimed at Bangladeshi private chambers: fast prescribing, multi-chamber patient history, DGDA drug search, CDSS alerts, RBAC for assistants, and print/digital Rx share.

This repository is a **logical multi-folder monorepo** (not a root npm workspace). **PostgreSQL** (native local install by default) is the primary shared database. The **NestJS API** (`apps/api`) provides JWT RBAC for six roles and Super Admin–controlled medicine search ranking. Role-specific Vite panels live under `apps/web-*`. The Electron desktop app still hosts the doctor HTML prototype (localStorage demo EHR) with an **optional** API bridge for ranked drug search. Docker Compose is **optional** and not required for day-to-day work. Full offline SQLite sync and production OTP/BMDC remain planned.

---

## 2. How the project was created (bootstrap story)

1. **Product plan** authored in `DEVELOPMENT_PLAN.md` (SDP from E-Rx/BD-STRAT/2026/01).
2. **Print/PDF kit** built under `templates/` — field catalog, JSON Schema, EN/BN locales, A4/A5 pad HTML, vanilla `PadRender`.
3. **Doctor UI** under `app-templates/frontend/clinical-os-doctor` (live prototype + DGDA pack). Unused vendor UI kits were removed to keep the repo lean.
4. **Doctor prototype** wired with `demo-db.js` (localStorage EHR) + DGDA formulary import (`scripts/import-dgda-medicines.py` → `data/dgda-drugs.js`, ~49,826 products).
5. **Electron shell** implemented in `apps/desktop` (TypeScript main/preload) that loads the doctor UI, exposes IPC, creates offline data directories, and packages Windows NSIS installers.
6. **Docs** added under `docs/` (workflow, usage, Bengali PDFs via `scripts/md_to_pdf_bn.py`).
7. **API foundation** — NestJS + Prisma + PostgreSQL, multi-role panels, Super Admin medicine ranking, k6 load harness; optional Compose/Redis/Nginx retained for later.

There is **no root `package.json`**. Each subproject installs independently. Desktop UI packaging remains **filesystem + Electron `extraResources`**. Panels talk to the API over HTTP/JWT.

---

## 3. Repository layout

```
prescription/
├── DEVELOPMENT_PLAN.md          # Product & engineering SDP
├── docker-compose.yml           # Optional later stack (not required)
├── docker-compose.scale.yml     # Optional scale profile
├── apps/
│   ├── api/                     # ★ NestJS + Prisma API
│   ├── desktop/                 # Electron doctor shell
│   ├── web-admin/               # SUPER_ADMIN / ADMIN
│   ├── web-assistant/           # ASSISTANT panel
│   ├── web-patient/             # PATIENT share view
│   └── web-pharmacy/            # PHARMACIST verify
├── app-templates/               # UI kits + Clinical OS HTML stubs
├── templates/                   # Rx print/PDF + form JSON contracts
├── loadtest/                    # k6 harness
├── infra/                       # Postgres init + Nginx configs
├── docs/                        # Product + this developer handbook
├── scripts/                     # Data/docs tooling + doc sync
└── .vscode/                     # Launch/tasks
```

**Naming rule of thumb**

| Folder | Meaning |
|---|---|
| `apps/` | Product code you run and ship |
| `app-templates/` | Doctor HTML prototype (`clinical-os-doctor`) |
| `templates/` | Prescription **print/PDF** contracts (not app chrome) |

### 3.1 Git branches and demo slices

Remote: `https://github.com/Zis-an/prescription-software.git`

| Branch | Purpose |
|---|---|
| `main` | Full monorepo — default clone and complete product demo |
| `stage` | Pre-production / UAT (promote from `main`) |
| `production` | Release line (promote from `stage` / `main`; tag `vX.Y.Z`) |
| `panel/admin` · `panel/assistant` · `panel/patient` · `panel/pharmacy` · `panel/doctor` | Thin runnable role slices (shared API platform + one surface) |

Annotated tags on `main` history for micro client demos: `demo/scaffold`, `demo/api-auth`, `demo/form-save`, `demo/pharmacy`, `demo/doctor`, `demo/full`.

Full workflow: [`docs/BRANCHING.md`](./BRANCHING.md).

---

## 4. Technologies in use

### 4.1 Implemented today

| Layer | Technology | Evidence |
|---|---|---|
| API | NestJS 10 + Prisma 6 + PostgreSQL 16 | `apps/api/` |
| Auth / RBAC | JWT + Passport; roles enum | `apps/api/src/auth/` |
| Admin / role panels | Vite vanilla JS | `apps/web-*` |
| Desktop runtime | Electron `^33.2.1` (doctor + role panels in separate windows) | `apps/desktop/package.json` |
| Main/preload language | TypeScript `^5.7.2` → CommonJS `dist/` | `apps/desktop/tsconfig.json` |
| Packaging | electron-builder `^25.1.8` (Windows NSIS) | `apps/desktop/package.json` `build` |
| Doctor UI | Vanilla HTML5 / CSS / IIFE JS | `app-templates/frontend/clinical-os-doctor/` |
| Demo persistence (doctor) | `localStorage` (`clinicalos.demo.v1`) | `demo-db.js` |
| Shared clinical DB | PostgreSQL (native local; optional Compose) | `.env` `DATABASE_URL` · [`LOCAL_SETUP.md`](./LOCAL_SETUP.md) |
| Drug KB (API) | `medicines` table + ranking | Prisma `Medicine` |
| Drug KB (offline pack) | In-memory columnar JS (~50k rows) | `data/dgda-drugs.js` |
| Cache/jobs stub | Redis (optional; not required to boot API) | `.env` `REDIS_URL` commented by default |
| LB | Nginx least_conn (optional scale profile) | `infra/nginx/` |
| Load tests | k6 | `loadtest/` |
| Print kit | JSON Schema + vanilla `PadRender` | `templates/` |
| Node requirement | `>=20` | api + desktop `engines` |

### 4.2 Still planned

Encrypted on-device SQLite sync, real OTP + BMDC verify, SMS/WhatsApp, full FHIR export, Next.js PWA port of doctor UI.

---

## 5. Modules — inventory, roles, maturity

<!-- AUTO:MODULE_INVENTORY:START -->
_This block is regenerated by `scripts/sync-developer-doc.py`. Do not hand-edit between markers._

| Module | Path | Role | Maturity | Present |
|---|---|---|---|---|
| clinical-os-api | `apps/api` | NestJS + Prisma API, RBAC, medicines ranking, PostgreSQL | Implemented (foundation) | yes |
| clinical-os-desktop | `apps/desktop` | Electron main/preload, IPC, packaging | Implemented (Phase 0) | yes |
| web-admin | `apps/web-admin` | SUPER_ADMIN / ADMIN panel (users, chambers, drug ranking) | Implemented (foundation) | yes |
| web-assistant | `apps/web-assistant` | Assistant queue/serial/vitals/fees panel | Implemented (foundation) | yes |
| web-patient | `apps/web-patient` | Patient Rx share-token view | Implemented (foundation) | yes |
| web-pharmacy | `apps/web-pharmacy` | Pharmacy verify-code panel | Implemented (foundation) | yes |
| clinical-os-doctor | `app-templates/frontend/clinical-os-doctor` | Doctor login/workbench/patients/queue (+ optional API search) | Interactive prototype | yes |
| prescription-template-kit | `templates` | Schemas, forms, A4/A5 pads, preview | Kit implemented; not wired to workbench print | yes |
| repo-scripts | `scripts` | DGDA import, BN PDF, developer-doc sync | Tooling | yes |
| loadtest | `loadtest` | k6 smoke + medicine search burst harness | Foundation harness | yes |
<!-- AUTO:MODULE_INVENTORY:END -->

### Module count (conceptual product modules)

See the auto inventory above. **Active product surfaces:** `apps/api`, `apps/web-*` panels, `apps/desktop` + doctor prototype, `templates` print kit.

---

## 6. Module dependencies and connections

### 6.1 Dependency graph

```mermaid
flowchart TB
  subgraph panels["Role panels"]
    ADMINP["web-admin"]
    ASST["web-assistant"]
    PAT["web-patient"]
    PHARM["web-pharmacy"]
  end

  subgraph product["Doctor path"]
    DESKTOP["apps/desktop"]
    DOCTOR["clinical-os-doctor"]
    DEMO["demo-db.js localStorage"]
    APICLIENT["api-client.js"]
  end

  API["apps/api NestJS"]
  PG[("PostgreSQL")]
  REDIS["Redis"]
  NGX["Nginx LB"]
  PRINT["templates/"]

  ADMINP --> API
  ASST --> API
  PAT --> API
  PHARM --> API
  NGX --> API
  API --> PG
  API --> REDIS
  DESKTOP --> DOCTOR
  DOCTOR --> DEMO
  DOCTOR --> APICLIENT
  APICLIENT -.->|"optional ranked search"| API
  DESKTOP --> PRINT
```

### 6.2 Roles and panels

| Role | Panel | Notes |
|---|---|---|
| `SUPER_ADMIN` | `apps/web-admin` | Users, chambers, **medicine boost/rank**, audit |
| `ADMIN` | `apps/web-admin` | Users/chambers/audit; ranking view-only |
| `DOCTOR` | desktop + doctor HTML | Prescribe; optional API search |
| `ASSISTANT` | `apps/web-assistant` | Queue/serial/vitals/fees only |
| `PATIENT` | `apps/web-patient` | Share-token Rx view |
| `PHARMACIST` | `apps/web-pharmacy` | Verify-code check |

### 6.3 How modules connect (runtime)

| From → To | Mechanism |
|---|---|
| Panels → API | `fetch` + Bearer JWT (`VITE_API_URL`) |
| API → PostgreSQL | Prisma (`DATABASE_URL`) |
| Nginx → API | Reverse proxy / least_conn (scale) |
| Desktop → Doctor UI | `loadFile` / `CLINICAL_OS_URL` |
| Doctor → Demo DB | `ClinicalOSDB` / `localStorage` |
| Doctor → API medicines | `ClinicalOSApiClient` when `CLINICAL_OS_API_URL` set |
| Import script → local DGDA pack | Python → `dgda-drugs.js`; seed imports subset into PG |

**There are no npm workspace links** between apps.

### 6.3 IPC contract

Defined in `apps/desktop/src/shared/channels.ts`:

| Channel | Purpose |
|---|---|
| `clinical-os:app-info` | App name, version, platform, entry |
| `clinical-os:data-path` | Offline store root under `userData` |
| `clinical-os:print` | Native print dialog |
| `clinical-os:sync-status` | Offline sync stub |
| `clinical-os:open-external` | Open http(s) URLs only |

Security defaults: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.

---

## 7. Database & storage — where it is, how it works

### 7.1 Primary database: PostgreSQL (active)

| Item | Value |
|---|---|
| Engine | PostgreSQL 16+ (native install recommended; Compose image optional) |
| Connection | `DATABASE_URL` in root `.env` |
| ORM / migrations | Prisma — `apps/api/prisma/schema.prisma` + `prisma/migrations/` |
| Create DB | `scripts/setup-local-db.ps1` or SQL in [`LOCAL_SETUP.md`](./LOCAL_SETUP.md) |
| Migrate / seed | `npx prisma migrate deploy` then `npx prisma db seed` from `apps/api` |
| Locate locally | `localhost:5432`, DB `clinicalos`, user `clinicalos` (see `.env.example`) |
| Extensions | `pg_trgm`, `uuid-ossp` (setup script / `infra/postgres/init.sql`) |

**TODO(dgda-auto-import):** Automate DGDA → `medicines` upsert + offline pack refresh when new drugs are published (preserve Super Admin ranking).

**Core tables:** `users`, `chambers`, `user_chambers`, `patients`, `medicines` (`search_rank`, `boost_score`), `prescriptions`, `medication_lines`, `queue_items`, `audit_logs`, `org_settings`.

**Medicine search order (Super Admin controllable):**

`ORDER BY boost_score DESC, search_rank ASC, brand ASC` — endpoints `GET /medicines/search`, `PATCH /medicines/:id/ranking` (SUPER_ADMIN only).

### 7.2 Doctor prototype local store (still active)

| Item | Value |
|---|---|
| Technology | `localStorage` JSON |
| Keys | `clinicalos.demo.v1`, `clinicalos.demo.meta` |
| Code | `demo-db.js` |
| Purpose | Offline-feeling doctor demo until sync lands |

### 7.3 Offline desktop dirs (still empty placeholders)

`%APPDATA%\clinical-os-desktop\clinical-os\{db,cache,outbox}` — future encrypted SQLite + sync outbox. Not the PostgreSQL location.

### 7.4 Local DGDA pack (offline formulary file)

`app-templates/frontend/clinical-os-doctor/data/dgda-drugs.js` (~49,826 rows). Seed imports a subset into PostgreSQL (`MEDICINE_SEED_LIMIT`, default 3000). Workbench uses API ranking when `CLINICAL_OS_API_URL` is set; otherwise local fuzzy search.

### 7.5 Contract schemas (print kit)

| Asset | Role |
|---|---|
| `templates/schemas/prescription.schema.json` | Print/form payload contract |
| `templates/catalog/fields.json` | Master field list |
| `templates/catalog/fhir-mapping.json` | Future FHIR export guidance |
| `templates/forms/*.form.json` | In-app form templates |

---

## 8. How each major piece works

### 8.1 Desktop startup

```
npm run dev
  → tsc (src → dist)
  → electron .
  → dist/main/index.js
       → single-instance lock
       → ensureDataDirs()
       → registerIpcHandlers()
       → buildAppMenu()
       → createMainWindow({ entry, remoteUrl })
       → preload exposes clinicalOSDesktop
       → loadFile(doctor HTML) OR loadURL(CLINICAL_OS_URL)
```

| Env var | Effect |
|---|---|
| `CLINICAL_OS_ENTRY` | `login` (default) \| `doctor`/`workbench` \| `patients` \| `queue` |
| `CLINICAL_OS_URL` | Load remote PWA instead of local HTML |

Path resolution (`paths.ts`):

- **Dev:** walk up to repo root → `app-templates/frontend/clinical-os-doctor` and `templates/`
- **Packaged:** `process.resourcesPath/ui/doctor` and `ui/print-templates`

### 8.2 Doctor UI pages

| Page | File | Job |
|---|---|---|
| Login | `login.html` | Demo OTP gate (`123456`) |
| Workbench | `workbench.html` | Compose Rx, CDSS banner, sign/print |
| Patients | `patients.html` | Search / open chart |
| Queue | `queue.html` | Serial / waiting list |

Shared assets: `app.js`, `demo-db.js`, `drug-kb.js`, `shared.css`, `data/dgda-drugs.js`.

### 8.3 Prescription compose → print (current)

1. Ensure demo DB; resolve active patient (session or queue “current”).
2. Fuzzy-search DGDA drugs; add lines to draft Rx.
3. Demo allergy CDSS (e.g. penicillin class checks in `drug-kb.js`).
4. **Sign & print** triggers Electron `clinicalOSDesktop.print()` or `window.print()`.
5. Print uses the **current DOM**, not yet `PadRender` + `templates/print`.
6. Sync chip reads demo session / IPC stub — sync is **not** implemented.

### 8.4 Print template kit

1. Build payload conforming to `prescription.schema.json`.
2. Choose paper (A5 default / A4) and locale (EN / BN).
3. `PadRender.mount(...)` fills `print/shared/*.body.html`.
4. Preview at `templates/preview/index.html` (local static server).

Workbench integration with this kit is a **next step**.

### 8.5 Packaging

`npm run dist:win` in `apps/desktop`:

1. Compile TypeScript.
2. electron-builder packs `dist/**` + copies doctor UI and `templates/` into `extraResources`.
3. Output: `apps/desktop/release/ClinicalOS-Setup-<version>.exe` (NSIS).

### 8.6 Admin / role panels

- Live ops: `apps/web-admin` (and other `apps/web-*` panels) against the Nest API.
- Unused vendor UI kits were removed from `app-templates/` to keep clones lean.

---

## 9. Implemented vs planned checklist

| Capability | Status |
|---|---|
| Electron host + secure preload | Done |
| Doctor login / workbench / patients / queue (demo) | Done |
| DGDA drug search (~50k local + PG ranked) | Done |
| Demo EHR in localStorage | Done |
| Native print IPC | Done |
| NestJS API + Prisma + PostgreSQL | Done (foundation) |
| JWT RBAC (6 roles) | Done |
| SUPER_ADMIN medicine ranking | Done |
| Admin / Assistant / Patient / Pharmacy panels | Done (foundation) |
| Local Postgres + Nest API (no Docker required) | Done |
| Optional Compose + Nginx scale profile | Available (optional) |
| k6 load-test harness | Done |
| Offline `db/cache/outbox` folders | Dirs only (desktop) + **localStorage sync outbox** |
| Online/offline sync engine | Done (foundation) — `sync-engine.js` + `POST /sync/push` |
| Encrypted SQLite local store | Planned |
| Workbench → PadRender print | Planned |
| Real OTP + BMDC auth | Planned |
| Immutable Rx versions + SMS/WA | Partial stubs / planned |

---

## 10. Entry points & common commands

```bash
# Local DB (once) — see docs/LOCAL_SETUP.md
# powershell -File scripts/setup-local-db.ps1

cp .env.example .env

# API (native Postgres; no Docker)
cd apps/api && npm install && npx prisma migrate deploy && npx prisma db seed && npm run start:dev

# Panels
cd apps/web-admin && npm install && npm run dev

# Desktop
cd apps/desktop && npm install && npm run dev

# Load test (API already running)
k6 run loadtest/k6-smoke.js

# Regenerate DGDA pack / docs
python scripts/import-dgda-medicines.py
python scripts/sync-developer-doc.py --note "..."
```

VS Code: task `desktop:dev`, `docs:sync-developer`.

---

## 11. Source map (key files)

| Concern | Path |
|---|---|
| Electron boot | `apps/desktop/src/main/index.ts` |
| Window load | `apps/desktop/src/main/window.ts` |
| IPC handlers | `apps/desktop/src/main/ipc.ts` |
| UI / data paths | `apps/desktop/src/main/paths.ts` |
| Preload bridge | `apps/desktop/src/preload/index.ts` |
| Channel names | `apps/desktop/src/shared/channels.ts` |
| Demo DB | `app-templates/frontend/clinical-os-doctor/demo-db.js` |
| Drug search | `app-templates/frontend/clinical-os-doctor/drug-kb.js` |
| Workbench UI | `app-templates/frontend/clinical-os-doctor/workbench.html` |
| Rx schema | `templates/schemas/prescription.schema.json` |
| Pad renderer | `templates/print/shared/render.js` |

---

## 12. Coding conventions for this repo

1. Prefer extending `apps/desktop` for the doctor shell; do not reintroduce legacy Electron stubs under `app-templates/`.
2. Keep IPC channel names in `shared/channels.ts` as the single source of truth.
3. Do not put secrets in the repo; `.env*` is gitignored.
4. Treat `templates/` as the legal pad contract — prefer changing catalog/schema/locales over one-off HTML hacks.
5. When replacing localStorage, preserve the **shape** of `ClinicalOSDB` entities so UI migration is incremental.
6. Keep `app-templates/` limited to the live doctor prototype (`clinical-os-doctor`); put new product UIs under `apps/`.
7. **Update this handbook** whenever architecture, storage, modules, or tech choices change (see §13).

---

## 13. Keeping this document up to date

### 13.1 Automatic / semi-automatic system

| Mechanism | What it does |
|---|---|
| `scripts/sync-developer-doc.py` | Scans the repo and rewrites machine-maintained blocks (module inventory, package versions, IPC channels, data-dir notes, changelog stub) |
| `.cursor/rules/update-developer-doc.mdc` | Instructs Cursor agents to update narrative + run the sync script after code changes |
| VS Code task `docs:sync-developer` | One-click refresh of auto sections |
| Optional pre-commit | See script `--check` mode to fail if auto blocks are stale |

### 13.2 When you must update manually

Update the **narrative** sections (not only run the script) if you:

- Add/remove a module or change how modules connect  
- Introduce a real database, ORM, or migration  
- Change startup flow, env vars, or IPC semantics  
- Ship a new capability that moves an item in §9  
- Change packaging / `extraResources` paths  

### 13.3 Changelog

<!-- AUTO:CHANGELOG:START -->
| Date | Change |
|---|---|
| 2026-11-26 | BMDC naming; bn docs; medicine-cache and allergy ownership notes |
| 2026-11-26 | Native Postgres default; Docker optional; DGDA auto-import TODO |
| 2026-11-25 | Remove unused vendor kits and generated duplicates |
| 2026-11-25 | Document Git branching and panel slices |
| 2026-11-26 | Default runtime = native Postgres (no Docker required); TODO(dgda-auto-import) tagged |
| 2026-11-25 | Docker stack available as optional path; fixed API seed/entrypoint for Nest dist/src/main.js |
| 2026-11-24 | Desktop packages Admin/Assistant/Patient/Pharmacy panels via Panels menu + extraResources |
| 2026-11-24 | Online/offline sync engine: localStorage outbox, health probe, POST /sync/push, live sync chip |
| 2026-11-24 | NestJS PostgreSQL API, multi-role panels, Super Admin medicine ranking, Docker LB + k6 harness |
| 2026-11-24 | Initial developer handbook + sync script + Cursor rule |
<!-- AUTO:CHANGELOG:END -->

Append a row (or let the sync script prepend one with `--note "..."`) for each meaningful implementation.

---

## 14. Recommended next engineering steps

1. Wire encrypted SQLite under `getDataPath()/db` and migrate off `localStorage`.
2. On sign, build a schema-valid payload and print via `PadRender` + `templates/print`.
3. Implement outbox writes + `setSyncStatus` updates.
4. Port doctor HTML to React/Vite (or load Next via `CLINICAL_OS_URL`) while keeping IPC bridge.
5. Stand up API + auth per `DEVELOPMENT_PLAN.md`.

---

<!-- AUTO:SNAPSHOT:START -->
_Generated snapshot — regenerated by `scripts/sync-developer-doc.py`._

- Snapshot time (UTC): `2026-11-26T10:56:13Z`
- Desktop package name/version: `clinical-os-desktop@0.1.0`
- Electron: `^33.2.1`
- TypeScript: `^5.7.2`
- electron-builder: `^25.1.8`
- Node engines: `>=20`
- DGDA drug rows (from meta.count): `49826`
- IPC channels: "clinical-os:app-info", "clinical-os:data-path", "clinical-os:print", "clinical-os:sync-status", "clinical-os:report-sync-status", "clinical-os:open-external"
- Offline dirs (created at runtime): `%APPDATA%/clinical-os-desktop/clinical-os/{db,cache,outbox}`
- Active clinical store today: `localStorage` key `clinicalos.demo.v1`
- Desktop package.json present: `True`
<!-- AUTO:SNAPSHOT:END -->
