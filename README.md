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
├── docker-compose.yml           # Postgres + Redis + API + Nginx
├── docker-compose.scale.yml     # 2× API replicas behind Nginx
├── apps/
│   ├── api/                     # NestJS + Prisma + PostgreSQL API
│   ├── desktop/                 # Electron doctor shell
│   ├── web-admin/               # SUPER_ADMIN / ADMIN panel
│   ├── web-assistant/           # Assistant queue panel
│   ├── web-patient/             # Patient Rx share view
│   └── web-pharmacy/            # Pharmacy verify panel
├── app-templates/               # UI kits & doctor HTML prototype
├── templates/                   # Rx print/PDF pads + schemas
├── loadtest/                    # k6 smoke + search burst
└── docs/                        # Developer / workflow / scale guides
```

## Quick start — API + PostgreSQL

Requires **Docker Desktop** and Node.js 20+.

```bash
cp .env.example .env
docker compose up --build -d

# API:     http://localhost:3001
# via LB:  http://localhost:8080
```

Local API against Compose Postgres only:

```bash
docker compose up -d postgres redis
cd apps/api
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

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

### Scale (2 API replicas)

```bash
docker compose -f docker-compose.yml -f docker-compose.scale.yml up --build -d
k6 run -e BASE_URL=http://localhost:8080 loadtest/k6-search-burst.js
```

See [`docs/SCALE.md`](docs/SCALE.md).

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
| [`docs/DEVELOPER.md`](docs/DEVELOPER.md) | **Developer handbook** — architecture, modules, DB, tech |
| [`docs/SCALE.md`](docs/SCALE.md) | 200k-user load-balance readiness |
| [`docs/WORKFLOW.md`](docs/WORKFLOW.md) | Clinical & operational workflow |
| [`docs/USAGE_GUIDE.md`](docs/USAGE_GUIDE.md) | Usage guide for all user types |
| [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md) | Product & engineering plan |

```bash
python scripts/sync-developer-doc.py --note "Short summary of what changed"
```

## License

Application code: proprietary / UNLICENSED until decided.  
Doctor UI under `app-templates/`: see `app-templates/LICENSES.md`.
