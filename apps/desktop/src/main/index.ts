import { app, BrowserWindow } from "electron";
import { registerIpcHandlers } from "./ipc";
import { buildAppMenu } from "./menu";
import { ensureDataDirs } from "./paths";
import { createMainWindow } from "./window";

app.setName("Clinical OS");

// Single instance — important for offline DB / sync locks later
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const ENTRY = process.env.CLINICAL_OS_ENTRY || "login";
const REMOTE = process.env.CLINICAL_OS_URL;

function getWindow(): BrowserWindow | null {
  return mainWindow;
}

function boot(): void {
  ensureDataDirs();
  registerIpcHandlers(getWindow, ENTRY);
  buildAppMenu(getWindow);

  mainWindow = createMainWindow({
    entry: ENTRY,
    remoteUrl: REMOTE,
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(boot);

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) boot();
});
