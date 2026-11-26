# Clinical OS API

NestJS + Prisma + PostgreSQL. JWT RBAC, medicines search ranking (Super Admin), multi-role endpoints.

**Runtime default:** native local PostgreSQL. Docker is optional and not required.

## Local (native Postgres)

1. Install PostgreSQL and create the DB (see [`docs/LOCAL_SETUP.md`](../../docs/LOCAL_SETUP.md)):

```powershell
# after PostgreSQL is installed and psql is on PATH
$env:PGPASSWORD = '<postgres-superuser-password>'
powershell -File ../../scripts/setup-local-db.ps1
```

2. From repo root:

```bash
cp .env.example .env
cd apps/api
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

API: http://localhost:3001  
Health: http://localhost:3001/health

Redis is **not** required to start the API today.

## Seeded accounts

| Role | Login | Password / OTP |
|---|---|---|
| SUPER_ADMIN | `superadmin@clinicalos.local` | `SuperAdmin123!` |
| ADMIN | `admin@clinicalos.local` | `Admin123!` |
| DOCTOR | `ayesha.rahman@clinicalos.demo` or phone | password `Doctor123!` or OTP `123456` |
| ASSISTANT | `assistant@clinicalos.local` | `Assistant123!` |
| PATIENT | phone `+8801811000001` | `Patient123!` |
| PHARMACIST | `pharmacy@clinicalos.local` | `Pharmacy123!` |

Demo Rx: `GET /prescriptions/share/demo-share-karim` · verify `GET /prescriptions/verify/DEMO01`

## Medicine ranking

Search order: `boost_score DESC`, `search_rank ASC`, `brand ASC`.  
Super Admin only: `PATCH /medicines/:id/ranking`, `PATCH /medicines/ranking/bulk`.

<!-- TODO(dgda-auto-import): Automated DGDA formulary sync into medicines (see seed.ts / import-dgda-medicines.py). -->
