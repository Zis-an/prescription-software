import { BrowserWindow, Menu, shell } from "electron";
import { openPanelWindow } from "./window";
import { resolveDoctorPage } from "./paths";

export function buildAppMenu(getWindow: () => BrowserWindow | null): void {
  const navigateDoctor = (page: string) => {
    const win = getWindow();
    if (!win) return;
    win.loadFile(resolveDoctorPage(page)).catch(console.error);
    if (win.isMinimized()) win.restore();
    win.focus();
  };

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "Print…",
          accelerator: "CmdOrCtrl+P",
          click: () => {
            const win = BrowserWindow.getFocusedWindow() || getWindow();
            win?.webContents.print({ printBackground: true });
          },
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
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
      label: "Doctor",
      submenu: [
        { label: "Sign in", accelerator: "CmdOrCtrl+0", click: () => navigateDoctor("login.html") },
        { label: "Workbench", accelerator: "CmdOrCtrl+1", click: () => navigateDoctor("workbench.html") },
        { label: "Patients", accelerator: "CmdOrCtrl+2", click: () => navigateDoctor("patients.html") },
        { label: "Queue", accelerator: "CmdOrCtrl+3", click: () => navigateDoctor("queue.html") },
      ],
    },
    {
      label: "Panels",
      submenu: [
        {
          label: "Admin / Super Admin",
          accelerator: "CmdOrCtrl+Shift+A",
          click: () => {
            void openPanelWindow("admin");
          },
        },
        {
          label: "Assistant",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => {
            void openPanelWindow("assistant");
          },
        },
        {
          label: "Patient Rx view",
          accelerator: "CmdOrCtrl+Shift+P",
          click: () => {
            void openPanelWindow("patient");
          },
        },
        {
          label: "Pharmacy verify",
          accelerator: "CmdOrCtrl+Shift+Y",
          click: () => {
            void openPanelWindow("pharmacy");
          },
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Open user data folder",
          click: async () => {
            const { ensureDataDirs } = await import("./paths");
            const { root } = ensureDataDirs();
            await shell.openPath(root);
          },
        },
        {
          label: "Clinical OS docs (plan)",
          click: async () => {
            const path = await import("node:path");
            const { app } = await import("electron");
            const plan = app.isPackaged
              ? null
              : path.resolve(__dirname, "..", "..", "..", "..", "DEVELOPMENT_PLAN.md");
            if (plan) await shell.openPath(plan);
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
