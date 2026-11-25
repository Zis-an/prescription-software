#!/usr/bin/env python3
"""
Regenerate machine-maintained sections of docs/DEVELOPER.md.

Usage:
  python scripts/sync-developer-doc.py
  python scripts/sync-developer-doc.py --note "Wired SQLite under userData/db"
  python scripts/sync-developer-doc.py --check   # exit 1 if auto blocks would change

Markers in DEVELOPER.md:
  <!-- AUTO:MODULE_INVENTORY:START --> ... <!-- AUTO:MODULE_INVENTORY:END -->
  <!-- AUTO:CHANGELOG:START --> ... <!-- AUTO:CHANGELOG:END -->
  <!-- AUTO:SNAPSHOT:START --> ... <!-- AUTO:SNAPSHOT:END -->
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DOC_PATH = REPO_ROOT / "docs" / "DEVELOPER.md"
DESKTOP_PKG = REPO_ROOT / "apps" / "desktop" / "package.json"
CHANNELS_TS = REPO_ROOT / "apps" / "desktop" / "src" / "shared" / "channels.ts"
DGDA_JS = (
    REPO_ROOT
    / "app-templates"
    / "frontend"
    / "clinical-os-doctor"
    / "data"
    / "dgda-drugs.js"
)

# Stable product inventory (path → metadata). Discovery adds package.json hits.
KNOWN_MODULES: list[dict[str, str]] = [
    {
        "name": "clinical-os-api",
        "path": "apps/api",
        "role": "NestJS + Prisma API, RBAC, medicines ranking, PostgreSQL",
        "maturity": "Implemented (foundation)",
    },
    {
        "name": "clinical-os-desktop",
        "path": "apps/desktop",
        "role": "Electron main/preload, IPC, packaging",
        "maturity": "Implemented (Phase 0)",
    },
    {
        "name": "web-admin",
        "path": "apps/web-admin",
        "role": "SUPER_ADMIN / ADMIN panel (users, chambers, drug ranking)",
        "maturity": "Implemented (foundation)",
    },
    {
        "name": "web-assistant",
        "path": "apps/web-assistant",
        "role": "Assistant queue/serial/vitals/fees panel",
        "maturity": "Implemented (foundation)",
    },
    {
        "name": "web-patient",
        "path": "apps/web-patient",
        "role": "Patient Rx share-token view",
        "maturity": "Implemented (foundation)",
    },
    {
        "name": "web-pharmacy",
        "path": "apps/web-pharmacy",
        "role": "Pharmacy verify-code panel",
        "maturity": "Implemented (foundation)",
    },
    {
        "name": "clinical-os-doctor",
        "path": "app-templates/frontend/clinical-os-doctor",
        "role": "Doctor login/workbench/patients/queue (+ optional API search)",
        "maturity": "Interactive prototype",
    },
    {
        "name": "clinical-os-pages",
        "path": "app-templates/admin/clinical-os-pages",
        "role": "Admin HTML stubs (superseded by web-admin for live ops)",
        "maturity": "Static stubs",
    },
    {
        "name": "prescription-template-kit",
        "path": "templates",
        "role": "Schemas, forms, A4/A5 pads, preview",
        "maturity": "Kit implemented; not wired to workbench print",
    },
    {
        "name": "electron-shell (legacy)",
        "path": "app-templates/desktop/electron-shell",
        "role": "Early Electron stub",
        "maturity": "Superseded",
    },
    {
        "name": "adminlte",
        "path": "app-templates/admin/adminlte",
        "role": "Vendor Bootstrap admin",
        "maturity": "Vendored (optional)",
    },
    {
        "name": "tabler",
        "path": "app-templates/admin/tabler",
        "role": "Vendor modern admin (pnpm/turbo)",
        "maturity": "Vendored (optional)",
    },
    {
        "name": "novena",
        "path": "app-templates/frontend/novena",
        "role": "Vendor clinic marketing theme",
        "maturity": "Vendored (optional)",
    },
    {
        "name": "flutter_healthcare",
        "path": "app-templates/mobile/flutter_healthcare",
        "role": "Flutter UI reference",
        "maturity": "Reference only",
    },
    {
        "name": "repo-scripts",
        "path": "scripts",
        "role": "DGDA import, BN PDF, developer-doc sync",
        "maturity": "Tooling",
    },
    {
        "name": "loadtest",
        "path": "loadtest",
        "role": "k6 smoke + medicine search burst harness",
        "maturity": "Foundation harness",
    },
]


def replace_block(text: str, name: str, body: str) -> str:
    start = f"<!-- AUTO:{name}:START -->"
    end = f"<!-- AUTO:{name}:END -->"
    pattern = re.compile(
        re.escape(start) + r".*?" + re.escape(end),
        re.DOTALL,
    )
    if not pattern.search(text):
        raise SystemExit(f"Missing markers for AUTO:{name} in {DOC_PATH}")
    replacement = f"{start}\n{body.rstrip()}\n{end}"
    return pattern.sub(replacement, text, count=1)


def read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def parse_ipc_channels() -> list[str]:
    if not CHANNELS_TS.exists():
        return []
    content = CHANNELS_TS.read_text(encoding="utf-8")
    return re.findall(r'"clinical-os:[^"]+"', content)


def dgda_count() -> str:
    if not DGDA_JS.exists():
        return "missing"
    # Prefer meta.count without loading the whole multi-MB file into regex greedily
    head = DGDA_JS.read_text(encoding="utf-8", errors="ignore")[:8000]
    m = re.search(r'"count"\s*:\s*(\d+)', head)
    return m.group(1) if m else "unknown"


def module_inventory_body() -> str:
    rows = [
        "_This block is regenerated by `scripts/sync-developer-doc.py`. Do not hand-edit between markers._",
        "",
        "| Module | Path | Role | Maturity | Present |",
        "|---|---|---|---|---|",
    ]
    for mod in KNOWN_MODULES:
        present = "yes" if (REPO_ROOT / Path(mod["path"])).exists() else "NO"
        rows.append(
            f"| {mod['name']} | `{mod['path']}` | {mod['role']} | {mod['maturity']} | {present} |"
        )

    # Discover other package.json roots under apps/ and app-templates/ (depth-limited)
    known_paths = {m["path"].replace("\\", "/") for m in KNOWN_MODULES}
    extras: list[str] = []
    for base in ("apps", "app-templates"):
        root = REPO_ROOT / base
        if not root.exists():
            continue
        for pkg in root.rglob("package.json"):
            # skip nested vendor noise deeper than 4 levels under base
            rel = pkg.parent.relative_to(REPO_ROOT).as_posix()
            if rel in known_paths:
                continue
            if "node_modules" in pkg.parts:
                continue
            # skip tabler internal packages (already covered by tabler root)
            if "/tabler/" in f"/{rel}/" and rel != "app-templates/admin/tabler":
                continue
            extras.append(rel)

    if extras:
        rows.append("")
        rows.append("**Additional package.json locations discovered:**")
        for rel in sorted(set(extras)):
            rows.append(f"- `{rel}`")

    return "\n".join(rows) + "\n"


def snapshot_body() -> str:
    pkg = read_json(DESKTOP_PKG)
    deps = pkg.get("devDependencies") or {}
    channels = parse_ipc_channels()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        "_Generated snapshot — regenerated by `scripts/sync-developer-doc.py`._",
        "",
        f"- Snapshot time (UTC): `{now}`",
        f"- Desktop package name/version: `{pkg.get('name', '?')}@{pkg.get('version', '?')}`",
        f"- Electron: `{deps.get('electron', 'n/a')}`",
        f"- TypeScript: `{deps.get('typescript', 'n/a')}`",
        f"- electron-builder: `{deps.get('electron-builder', 'n/a')}`",
        f"- Node engines: `{ (pkg.get('engines') or {}).get('node', 'n/a') }`",
        f"- DGDA drug rows (from meta.count): `{dgda_count()}`",
        f"- IPC channels: {', '.join(channels) if channels else '_none found_'}",
        f"- Offline dirs (created at runtime): `%APPDATA%/clinical-os-desktop/clinical-os/{{db,cache,outbox}}`",
        f"- Active clinical store today: `localStorage` key `clinicalos.demo.v1`",
        f"- Desktop package.json present: `{DESKTOP_PKG.exists()}`",
    ]
    return "\n".join(lines) + "\n"


def update_changelog(text: str, note: str | None) -> str:
    if not note:
        return text
    start = "<!-- AUTO:CHANGELOG:START -->"
    end = "<!-- AUTO:CHANGELOG:END -->"
    m = re.search(re.escape(start) + r"(.*?)" + re.escape(end), text, re.DOTALL)
    if not m:
        raise SystemExit("Missing CHANGELOG markers")
    inner = m.group(1).strip("\n")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    new_row = f"| {today} | {note.strip()} |"
    # Insert after header separator line
    lines = inner.splitlines()
    insert_at = 0
    for i, line in enumerate(lines):
        if line.startswith("|---"):
            insert_at = i + 1
            break
    # Avoid duplicate identical note for same day
    if any(new_row == line for line in lines):
        return text
    lines.insert(insert_at, new_row)
    body = "\n".join(lines) + "\n"
    return replace_block(text, "CHANGELOG", body)


def bump_last_reviewed(text: str) -> str:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return re.sub(
        r"(\*\*Last reviewed:\*\*\s*)\d{4}-\d{2}-\d{2}",
        rf"\g<1>{today}",
        text,
        count=1,
    )


def normalize_for_check(text: str) -> str:
    """Ignore volatile timestamps so --check only flags real drift."""
    text = re.sub(
        r"(- Snapshot time \(UTC\): `)[^`]+(`)",
        r"\1<ts>\2",
        text,
    )
    text = re.sub(
        r"(\*\*Last reviewed:\*\*\s*)\d{4}-\d{2}-\d{2}",
        r"\1<date>",
        text,
    )
    return text


def sync(note: str | None = None) -> str:
    original = DOC_PATH.read_text(encoding="utf-8")
    updated = original
    updated = replace_block(updated, "MODULE_INVENTORY", module_inventory_body())
    updated = replace_block(updated, "SNAPSHOT", snapshot_body())
    updated = update_changelog(updated, note)
    updated = bump_last_reviewed(updated)
    return updated


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--note",
        help="Changelog row describing what changed (UTC date auto-stamped)",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit 1 if docs/DEVELOPER.md auto sections are stale",
    )
    args = parser.parse_args()

    if not DOC_PATH.exists():
        print(f"Missing {DOC_PATH}", file=sys.stderr)
        return 2

    updated = sync(args.note)
    current = DOC_PATH.read_text(encoding="utf-8")

    if args.check:
        if normalize_for_check(updated) != normalize_for_check(current):
            print("docs/DEVELOPER.md is stale — run: python scripts/sync-developer-doc.py")
            return 1
        print("docs/DEVELOPER.md auto sections are up to date.")
        return 0

    if updated == current:
        print("No changes needed.")
        return 0

    DOC_PATH.write_text(updated, encoding="utf-8", newline="\n")
    print(f"Updated {DOC_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
