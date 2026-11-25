# Git branching, panel slices, and client demos

**Remote:** `https://github.com/Zis-an/prescription-software.git`

This repository uses environment branches, role panel slices, and annotated `demo/*` tags so you can demonstrate a thin feature or a single role without shipping the full monorepo.

## Environment branches

| Branch | Purpose |
|---|---|
| `main` | Full product. Default clone. Complete client demo. |
| `stage` | Pre-production / UAT. Promote from `main` by merge. |
| `production` | Release line. Promote from `stage` (or `main`) by merge; tag `vX.Y.Z`. |

Promotion flow: `main` → `stage` → `production`.

## Panel slices (`panel/*`)

Thin, independently runnable trees. Each keeps the **shared platform** (Compose, `infra/`, `apps/api/`, DGDA seed data path) plus one role surface.

| Branch | Surface | Dev port |
|---|---|---|
| `panel/admin` | `apps/web-admin` | `:5173` |
| `panel/assistant` | `apps/web-assistant` | `:5174` |
| `panel/patient` | `apps/web-patient` | `:5175` |
| `panel/pharmacy` | `apps/web-pharmacy` | `:5176` |
| `panel/doctor` | `apps/desktop` + `clinical-os-doctor` + `templates/` | Electron |

### Clone a slice

```bash
git clone -b panel/pharmacy https://github.com/Zis-an/prescription-software.git
cd prescription-software
cp .env.example .env
docker compose up -d postgres redis
cd apps/api && npm install && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
# other terminal
cd apps/web-pharmacy && npm install && npm run dev
```

Doctor slice (offline OK; API optional for ranked search):

```bash
git clone -b panel/doctor https://github.com/Zis-an/prescription-software.git
cd prescription-software
cd apps/desktop && npm install && npm run dev
```

## Demo tags (micro walkthroughs)

Checkout a tag to freeze the tree at a demo milestone on the `main` history:

| Tag | What to show |
|---|---|
| `demo/scaffold` | Repo skeleton, env sample, ignore rules |
| `demo/api-auth` | NestJS API + JWT RBAC + health |
| `demo/form-save` | Clinical API writes (patients, prescriptions, queue, medicines) |
| `demo/pharmacy` | Pharmacy verify panel on full platform |
| `demo/doctor` | Electron doctor workbench |
| `demo/full` | Complete monorepo (`main` HEAD at tagging time) |

```bash
git fetch --tags
git checkout demo/form-save
cp .env.example .env
docker compose up -d postgres redis
cd apps/api && npm install && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
```

Example “save a form” check after `demo/form-save` (API running, seed loaded):

```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"ayesha.rahman@clinicalos.demo\",\"password\":\"Doctor123!\"}"
# use returned access_token for authenticated patient / prescription POSTs
```

## Refreshing a panel slice from `main`

Panel branches intentionally delete unrelated apps. After platform changes on `main`:

1. Merge or rebase `main` into `panel/<role>`.
2. Re-delete paths that do not belong on that slice (other `apps/web-*`, etc.).
3. Keep the slice root README and (for doctor) the `dev` script that does not require other panels.
4. Commit: `chore(panel/<role>): refresh slice from main`.

## Conventions

- Commits: [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `docs`, `chore`, scopes like `api`, `web-pharmacy`).
- Do not commit `.env`, secrets, or `node_modules/`.
- Day-to-day product work lands on `main`; cut or refresh `panel/*` when a role demo must stay lean.
