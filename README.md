# Clinical OS — `panel/assistant` slice

Thin runnable checkout: shared API platform + **assistant** panel only.

**Remote branch:** `panel/assistant`  
**Full monorepo:** `main` · [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)

## Run locally (native PostgreSQL — no Docker)

```bash
git clone -b panel/assistant https://github.com/Zis-an/prescription-software.git
cd prescription-software
cp .env.example .env
# powershell -File scripts/setup-local-db.ps1
cd apps/api && npm install && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
```

Other terminal: `cd apps/web-assistant && npm install && npm run dev` → http://localhost:5174

Login: `assistant@clinicalos.local` / `Assistant123!`
