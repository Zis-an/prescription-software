/**
 * Clinical OS desktop shell (Electron)
 * ------------------------------------
 * Loads local HTML UI templates in a native window.
 * Point CLINICAL_OS_ENTRY / CLINICAL_OS_URL at any admin or frontend build.
 * Replace Electron with Tauri anytime — same HTML assets.
 */
const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

const ENTRY = process.env.CLINICAL_OS_ENTRY || "admin";
const REMOTE = process.env.CLINICAL_OS_URL; // e.g. http://localhost:5173

function resolveEntryUrl() {
  if (REMOTE) return REMOTE;

  // Default: AdminLTE dist index (after npm build) or fallback placeholder
  const map = {
    admin: path.join(
      __dirname,
      "..",
      "..",
      "admin",
      "adminlte",
      "dist",
      "index.html"
    ),
    frontend: path.join(
      __dirname,
      "..",
      "..",
      "frontend",
      "novena",
      "theme",
      "index.html"
    ),
    placeholder: path.join(__dirname, "placeholder.html"),
  };

  const file = map[ENTRY] || map.placeholder;
  return `file://${file}`;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 840,
    minWidth: 1024,
    minHeight: 640,
    title: "Clinical OS Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const url = resolveEntryUrl();
  win.loadURL(url).catch(() => {
    win.loadFile(path.join(__dirname, "placeholder.html"));
  });

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "View",
        submenu: [
          { role: "reload" },
          { role: "toggleDevTools" },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
      {
        label: "Navigate",
        submenu: [
          {
            label: "Admin template",
            click: () => {
              process.env.CLINICAL_OS_ENTRY = "admin";
              win.loadURL(resolveEntryUrl());
            },
          },
          {
            label: "Frontend template",
            click: () => {
              process.env.CLINICAL_OS_ENTRY = "frontend";
              win.loadURL(resolveEntryUrl());
            },
          },
        ],
      },
    ])
  );
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
