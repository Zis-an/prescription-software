# Clinical OS — `panel/pharmacy` slice

Thin runnable checkout: shared API platform + **pharmacy** panel only.

**Remote branch:** `panel/pharmacy`  
**Full monorepo:** `main` · [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)

## Run locally (native PostgreSQL — no Docker)

```bash
git clone -b panel/pharmacy https://github.com/Zis-an/prescription-software.git
cd prescription-software
cp .env.example .env
# powershell -File scripts/setup-local-db.ps1
cd apps/api && npm install && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
```

Other terminal: `cd apps/web-pharmacy && npm install && npm run dev` → http://localhost:5176

Login: `pharmacy@clinicalos.local` / `Pharmacy123!`
