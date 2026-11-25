import { BrowserWindow, ipcMain, shell, app } from "electron";
import { IpcChannels } from "../shared/channels";
import type { AppInfo, PrintOptions, SyncStatus } from "../shared/types";
import { ensureDataDirs } from "./paths";

/** Updated by renderer sync-engine via reportSyncStatus */
let syncStatus: SyncStatus = {
  state: "offline",
  pendingOps: 0,
  lastSyncedAt: null,
  message: "Waiting for sync engine…",
};

export function registerIpcHandlers(getWindow: () => BrowserWindow | null, entry: string): void {
  ipcMain.handle(IpcChannels.APP_INFO, async (): Promise<AppInfo> => ({
    name: "Clinical OS",
    version: app.getVersion(),
    platform: process.platform,
    isDesktop: true,
    electronVersion: process.versions.electron,
    entry,
  }));

  ipcMain.handle(IpcChannels.DATA_PATH, async () => ensureDataDirs().root);

  ipcMain.handle(IpcChannels.SYNC_STATUS, async (): Promise<SyncStatus> => syncStatus);

  ipcMain.handle(IpcChannels.REPORT_SYNC_STATUS, async (_event, next: SyncStatus) => {
    syncStatus = {
      state: next?.state || "offline",
      pendingOps: Number(next?.pendingOps) || 0,
      lastSyncedAt: next?.lastSyncedAt ?? null,
      message: next?.message,
    };
  });

  ipcMain.handle(IpcChannels.PRINT, async (_event, options?: PrintOptions): Promise<boolean> => {
    const win = getWindow();
    if (!win) return false;

    return new Promise((resolve) => {
      win.webContents.print(
        {
          silent: options?.silent ?? false,
          printBackground: options?.printBackground ?? true,
          deviceName: options?.deviceName,
        },
        (success) => resolve(success)
      );
    });
  });

  ipcMain.handle(IpcChannels.OPEN_EXTERNAL, async (_event, url: string) => {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      throw new Error("Only http(s) URLs are allowed");
    }
    await shell.openExternal(url);
  });
}

/** Allow main-process code to update sync indicator later */
export function setSyncStatus(next: SyncStatus): void {
  syncStatus = next;
}
