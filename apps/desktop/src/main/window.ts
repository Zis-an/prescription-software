import { BrowserWindow } from "electron";
import path from "node:path";
import {
  PanelKind,
  resolveDoctorPage,
  resolvePanelLoadTarget,
} from "./paths";

export interface CreateWindowOptions {
  entry: string;
  remoteUrl?: string;
}

const panelWindows = new Map<PanelKind, BrowserWindow>();

function basePrefs() {
  return {
    preload: path.join(__dirname, "..", "preload", "index.js"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    spellcheck: true,
  } as const;
}

function iconPath() {
  return path.join(__dirname, "..", "..", "resources", "icon.png");
}

export function createMainWindow(options: CreateWindowOptions): BrowserWindow {
  const win = new BrowserWindow({
    width: 1366,
    height: 840,
    minWidth: 1024,
    minHeight: 640,
    title: "Clinical OS — Doctor",
    backgroundColor: "#0a2f27",
    icon: iconPath(),
    show: false,
    webPreferences: basePrefs(),
  });

  win.once("ready-to-show", () => win.show());

  const injectApiUrl = () => {
    const api = process.env.CLINICAL_OS_API_URL || "http://localhost:3001";
    win.webContents
      .executeJavaScript(`window.CLINICAL_OS_API_URL = ${JSON.stringify(api)};`)
      .catch(() => undefined);
  };
  win.webContents.on("did-finish-load", injectApiUrl);

  const load = async () => {
    if (options.remoteUrl) {
      await win.loadURL(options.remoteUrl);
      return;
    }

    const page =
      options.entry === "workbench" || options.entry === "doctor"
        ? "workbench.html"
        : options.entry === "patients"
          ? "patients.html"
          : options.entry === "queue"
            ? "queue.html"
            : options.entry === "admin"
              ? null
              : "login.html";

    if (options.entry === "admin" || options.entry === "assistant" || options.entry === "patient" || options.entry === "pharmacy") {
      await openPanelWindow(options.entry);
      // Still load doctor login as main
      await win.loadFile(resolveDoctorPage("login.html"));
      return;
    }

    try {
      await win.loadFile(resolveDoctorPage(page || "login.html"));
    } catch (err) {
      console.error("Failed to load doctor UI:", err);
      await win.loadURL(
        `data:text/html,${encodeURIComponent(
          `<h1>Clinical OS</h1><p>Could not load UI. Run from repo root and ensure doctor templates exist.</p><pre>${String(err)}</pre>`
        )}`
      );
    }
  };

  void load();
  return win;
}

const PANEL_TITLES: Record<PanelKind, string> = {
  admin: "Clinical OS — Admin",
  assistant: "Clinical OS — Assistant",
  patient: "Clinical OS — Patient",
  pharmacy: "Clinical OS — Pharmacy",
};

export async function openPanelWindow(kind: PanelKind): Promise<BrowserWindow> {
  const existing = panelWindows.get(kind);
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) existing.restore();
    existing.focus();
    return existing;
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: PANEL_TITLES[kind],
    backgroundColor: "#e8efeb",
    icon: iconPath(),
    show: false,
    webPreferences: basePrefs(),
  });

  win.once("ready-to-show", () => win.show());
  win.on("closed", () => {
    panelWindows.delete(kind);
  });

  const target = resolvePanelLoadTarget(kind);
  try {
    if (target.type === "file") {
      await win.loadFile(target.target);
    } else {
      await win.loadURL(target.target);
    }
  } catch (err) {
    console.error(`Failed to load ${kind} panel:`, err);
    await win.loadURL(
      `data:text/html,${encodeURIComponent(
        `<h1>${PANEL_TITLES[kind]}</h1>
         <p>Panel UI not found. Build it first:</p>
         <pre>cd apps/web-${kind} && npm install && npm run build</pre>
         <p>Or start the Vite dev server on port for hot reload.</p>
         <pre>${String(err)}</pre>`
      )}`
    );
  }

  // Inject API base for panels that read window.CLINICAL_OS_API_URL
  win.webContents.on("did-finish-load", () => {
    const api = process.env.CLINICAL_OS_API_URL || "http://localhost:3001";
    win.webContents
      .executeJavaScript(`window.CLINICAL_OS_API_URL = ${JSON.stringify(api)};`)
      .catch(() => undefined);
  });

  panelWindows.set(kind, win);
  return win;
}

export function getPanelWindows(): BrowserWindow[] {
  return [...panelWindows.values()].filter((w) => !w.isDestroyed());
}
