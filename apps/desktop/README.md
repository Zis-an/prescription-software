# Clinical OS — Desktop

Electron desktop client for the doctor workbench. Loads the same UI templates as the web app, with native print, local data dirs, and IPC stubs for offline sync.

## Prerequisites

- Node.js 20+ (LTS recommended)
- Windows 10/11 (primary target for BD chambers)

## Quick start

```bash
cd apps/desktop
npm install
npm run dev
```

Opens the **Rx workbench** from `app-templates/frontend/clinical-os-doctor`.

### Useful variants

```bash
# Login screen
$env:CLINICAL_OS_ENTRY="login"; npm run start

# Point at a local web app (Next/Vite later)
$env:CLINICAL_OS_URL="http://localhost:3000"; npm run start
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Compile TypeScript + launch Electron |
| `npm run typecheck` | Type-check only |
| `npm run pack` | Unpackaged build into `release/` |
| `npm run dist:win` | Windows NSIS installer |

## Architecture (Phase 0)

```
src/
  main/       Electron main process (window, menu, IPC, paths)
  preload/    Safe bridge → window.clinicalOSDesktop
  shared/     IPC channel names + types
```

Bundled UIs (dev from repo; packaged under `resources/ui/`):

| Surface | Source | Menu |
|---|---|---|
| Doctor | `app-templates/frontend/clinical-os-doctor` | **Doctor** |
| Admin | `apps/web-admin/dist` | **Panels → Admin** |
| Assistant | `apps/web-assistant/dist` | **Panels → Assistant** |
| Patient | `apps/web-patient/dist` | **Panels → Patient** |
| Pharmacy | `apps/web-pharmacy/dist` | **Panels → Pharmacy** |

`npm run dev` builds all panel Vite apps, then launches Electron.  
`npm run dev:main` skips panel rebuilds (use when `dist/` already exists).

Renderer API (`window.clinicalOSDesktop`):

- `getAppInfo()` — version / platform
- `getDataPath()` — offline store root under userData
- `getSyncStatus()` / `reportSyncStatus()` — sync engine bridge
- `print(options?)` — native print dialog
- `openExternal(url)` — http(s) only

Local data folders (created on boot):

`%APPDATA%/clinical-os-desktop/clinical-os/{db,cache,outbox}`

Panels call the API at `CLINICAL_OS_API_URL` (default `http://localhost:3001`).

## Next development steps

1. Port doctor HTML stubs → React/Vite (or load Next PWA via `CLINICAL_OS_URL`)
2. Wire SQLite / encrypted local DB under `getDataPath()`
3. Conflict-aware sync polish + PgBouncer at scale
4. Hook print CSS from `templates/` print pads
5. Add auto-update when staging builds exist

See root `DEVELOPMENT_PLAN.md` for product scope.
