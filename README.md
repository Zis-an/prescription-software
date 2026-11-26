# Clinical OS — `panel/patient` slice

Thin runnable checkout: shared API platform + **patient** panel only.

**Remote branch:** `panel/patient`  
**Full monorepo:** `main` · [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)

## Run locally (native PostgreSQL — no Docker)

```bash
git clone -b panel/patient https://github.com/Zis-an/prescription-software.git
cd prescription-software
cp .env.example .env
# powershell -File scripts/setup-local-db.ps1
cd apps/api && npm install && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
```

Other terminal: `cd apps/web-patient && npm install && npm run dev` → http://localhost:5175

Login: `+8801811000001` / `Patient123!`
