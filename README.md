# Clinical OS (BD)

Unified clinical practice platform for Bangladesh — prescribe fast, offline-first, multi-chamber EHR.

**Tagline:** One Doctor. One Patient Record. Every Chamber.

**Repository:** [github.com/Zis-an/prescription-software](https://github.com/Zis-an/prescription-software)

## Branches and client demos

| Branch | Use |
|---|---|
| `main` | Full monorepo — complete product demo |
| `stage` | Pre-production / UAT |
| `production` | Release line |
| `panel/admin` · `panel/assistant` · `panel/patient` · `panel/pharmacy` · `panel/doctor` | Thin runnable role slices |

Micro demos: checkout annotated tags such as `demo/form-save`, `demo/pharmacy`, `demo/doctor`, `demo/full`.

Full branching guide: [`docs/BRANCHING.md`](docs/BRANCHING.md)

## Repo layout

```
prescription/
├── DEVELOPMENT_PLAN.md          # Full product & engineering plan
├── apps/
│   ├── api/                     # NestJS + Prisma + PostgreSQL API
│   ├── desktop/                 # Electron doctor shell
│   ├── web-admin/               # SUPER_ADMIN / ADMIN panel
│   ├── web-assistant/           # Assistant queue panel
│   ├── web-patient/             # Patient Rx share view
│   └── web-pharmacy/            # Pharmacy verify panel
├── app-templates/               # Doctor HTML prototype + DGDA pack
├── templates/                   # Rx print/PDF pads + schemas
├── loadtest/                    # k6 smoke + search burst
├── docker-compose*.yml          # Optional later (not required)
└── docs/                        # Developer / workflow / local setup
```

## Quick start — local PostgreSQL (no Docker)

Requires **PostgreSQL** (native install) and **Node.js 20+**.

1. Install Postgres and create the app DB — see [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md).

```powershell
# after psql is on PATH
$env:PGPASSWORD = '<postgres-superuser-password>'
powershell -File scripts/setup-local-db.ps1
```

2. Run the API:

```bash
cp .env.example .env
cd apps/api
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

API: http://localhost:3001 · Health: http://localhost:3001/health

Redis is **optional** and not required to start the API today.

### Seeded logins

| Role | Login | Password |
|---|---|---|
| SUPER_ADMIN | `superadmin@clinicalos.local` | `SuperAdmin123!` |
| ADMIN | `admin@clinicalos.local` | `Admin123!` |
| DOCTOR | `ayesha.rahman@clinicalos.demo` | `Doctor123!` or OTP `123456` |
| ASSISTANT | `assistant@clinicalos.local` | `Assistant123!` |
| PATIENT | phone `+8801811000001` | `Patient123!` |
| PHARMACIST | `pharmacy@clinicalos.local` | `Pharmacy123!` |

Demo Rx: share token `demo-share-karim` · verify code `DEMO01`

### Role panels

```bash
cd apps/web-admin && npm install && npm run dev      # :5173
cd apps/web-assistant && npm install && npm run dev  # :5174
cd apps/web-patient && npm install && npm run dev    # :5175
cd apps/web-pharmacy && npm install && npm run dev   # :5176
```

Super Admin controls **medicine search order** (`boost_score` / `search_rank`) on the Drug KB page.

### Optional Docker / scale

Compose files are kept for a future optional stack. Day-to-day development does **not** use Docker. Scale notes: [`docs/SCALE.md`](docs/SCALE.md).

## Desktop (doctor workbench)

```bash
cd apps/desktop
npm install
npm run dev
```

Optional ranked search from PostgreSQL: set `window.CLINICAL_OS_API_URL = "http://localhost:3001"` in the workbench (or meta `clinical-os-api`).

Details: [`apps/desktop/README.md`](apps/desktop/README.md)

## Documentation

| Doc | Purpose |
|---|---|
| [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md) | Native Postgres setup (no Docker) |
| [`docs/DEVELOPER.md`](docs/DEVELOPER.md) | **Developer handbook** — architecture, modules, DB, tech |
| [`docs/BRANCHING.md`](docs/BRANCHING.md) | Git branches, panel slices, demo tags |
| [`docs/SCALE.md`](docs/SCALE.md) | Load-balance readiness (optional Compose) |
| [`docs/WORKFLOW.md`](docs/WORKFLOW.md) | Clinical & operational workflow |
| [`docs/ENTRY_POINTS.md`](docs/ENTRY_POINTS.md) | Mermaid diagrams — roles & visit flow |
| [`docs/USAGE_GUIDE.md`](docs/USAGE_GUIDE.md) | Usage guide for all user types |
| [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md) | Product & engineering plan |
| [`docs/bn/`](docs/bn/README.md) | বাংলা docs (মিশ্র বাংলা–ইংরেজি) |

```bash
python scripts/sync-developer-doc.py --note "Short summary of what changed"
```

## License

Application code: proprietary / UNLICENSED until decided.  
Doctor UI under `app-templates/`: see `app-templates/LICENSES.md`.
