# Clinical OS API

NestJS + Prisma + PostgreSQL. JWT RBAC, medicines search ranking (Super Admin), multi-role endpoints.

## Local (Postgres via Docker)

```bash
# from repo root
cp .env.example .env
docker compose up -d postgres redis

cd apps/api
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

API: http://localhost:3001  
Health: http://localhost:3001/health

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
