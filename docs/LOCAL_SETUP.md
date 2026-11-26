# Local setup (no Docker required)

**Default path for this project:** native **PostgreSQL** on your machine + Node.js 20+ running the Nest API. Docker Compose files remain in the repo as an **optional** later path only.

## 1. Install PostgreSQL

### Windows

**Recommended:** install the official Windows installer (run as Administrator):

https://www.postgresql.org/download/windows/

Or EnterpriseDB direct (example version):

https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

During setup:
- Keep port **5432**
- Set a **postgres** superuser password you will remember (local learning only)
- Install Command Line Tools so `psql` is available

Add `psql` to PATH if needed (typical):

`C:\Program Files\PostgreSQL\17\bin`

Ensure the Windows service is running (Services → `postgresql-x64-17` or similar).

Optional winget (sometimes blocked by CDN 403):

```powershell
winget install --id PostgreSQL.PostgreSQL.17 -e --accept-package-agreements --accept-source-agreements
```

### Verify

```powershell
psql --version
psql -U postgres -c "SELECT version();"
```

## 2. Create the Clinical OS database role

From repo root (PowerShell), using the `postgres` superuser:

```powershell
$env:PGPASSWORD = "<your-postgres-superuser-password>"
psql -U postgres -h localhost -c "CREATE USER clinicalos WITH PASSWORD 'clinicalos_dev' CREATEDB;"
psql -U postgres -h localhost -c "CREATE DATABASE clinicalos OWNER clinicalos;"
psql -U postgres -h localhost -d clinicalos -c "CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

Or run:

```powershell
powershell -File scripts/setup-local-db.ps1
```

(Prompts for the superuser password if `PGPASSWORD` is unset.)

## 3. App environment

```powershell
cp .env.example .env
```

Confirm `.env` has:

```env
DATABASE_URL=postgresql://clinicalos:clinicalos_dev@localhost:5432/clinicalos?schema=public
```

`REDIS_URL` is **optional** today (not required to start the API). Leave it or comment it; caching/jobs are future work.

## 4. Run the API

```powershell
cd apps/api
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

Health: http://localhost:3001/health

## 5. Run a panel (example)

```powershell
cd apps/web-admin
npm install
npm run dev
```

## Optional: Docker later

Only if you choose to: `docker-compose.yml` can still start Postgres/Redis/API/Nginx together. It is **not** required for day-to-day development after this decision.
