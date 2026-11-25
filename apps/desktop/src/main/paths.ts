import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

export type PanelKind = "admin" | "assistant" | "patient" | "pharmacy";

const PANEL_DEV_PORTS: Record<PanelKind, number> = {
  admin: 5173,
  assistant: 5174,
  patient: 5175,
  pharmacy: 5176,
};

function repoRoot(): string {
  return path.resolve(__dirname, "..", "..", "..", "..");
}

/**
 * Resolve bundled / dev UI assets.
 * Dev: repo app-templates or apps/web-<panel>/dist
 * Packaged: process.resourcesPath + ui/<name>
 */
export function resolveUiRoot(kind: "doctor" | "print" | PanelKind): string {
  if (app.isPackaged) {
    const map: Record<string, string> = {
      doctor: "doctor",
      print: "print-templates",
      admin: "admin",
      assistant: "assistant",
      patient: "patient",
      pharmacy: "pharmacy",
    };
    return path.join(process.resourcesPath, "ui", map[kind]);
  }

  const root = repoRoot();
  if (kind === "doctor") {
    return path.join(root, "app-templates", "frontend", "clinical-os-doctor");
  }
  if (kind === "print") {
    return path.join(root, "templates");
  }
  return path.join(root, "apps", `web-${kind}`, "dist");
}

export function resolveDoctorPage(page = "workbench.html"): string {
  return path.join(resolveUiRoot("doctor"), page);
}

export function resolvePanelIndex(kind: PanelKind): string {
  return path.join(resolveUiRoot(kind), "index.html");
}

export function panelDevUrl(kind: PanelKind): string {
  return `http://localhost:${PANEL_DEV_PORTS[kind]}`;
}

/** Prefer built dist; fall back to Vite dev server URL when dist is missing. */
export function resolvePanelLoadTarget(kind: PanelKind): { type: "file" | "url"; target: string } {
  const file = resolvePanelIndex(kind);
  if (fs.existsSync(file)) {
    return { type: "file", target: file };
  }
  return { type: "url", target: panelDevUrl(kind) };
}

/** Local encrypted store / offline DB will live under userData */
export function ensureDataDirs(): { root: string; db: string; cache: string; outbox: string } {
  const root = path.join(app.getPath("userData"), "clinical-os");
  const db = path.join(root, "db");
  const cache = path.join(root, "cache");
  const outbox = path.join(root, "outbox");

  for (const dir of [root, db, cache, outbox]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return { root, db, cache, outbox };
}
