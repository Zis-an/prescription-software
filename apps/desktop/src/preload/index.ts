import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "../shared/channels";
import type { ClinicalOSDesktopApi, PrintOptions } from "../shared/types";

const api: ClinicalOSDesktopApi = {
  getAppInfo: () => ipcRenderer.invoke(IpcChannels.APP_INFO),
  getDataPath: () => ipcRenderer.invoke(IpcChannels.DATA_PATH),
  getSyncStatus: () => ipcRenderer.invoke(IpcChannels.SYNC_STATUS),
  reportSyncStatus: (status) => ipcRenderer.invoke(IpcChannels.REPORT_SYNC_STATUS, status),
  print: (options?: PrintOptions) => ipcRenderer.invoke(IpcChannels.PRINT, options),
  openExternal: (url: string) => ipcRenderer.invoke(IpcChannels.OPEN_EXTERNAL, url),
};

contextBridge.exposeInMainWorld("clinicalOSDesktop", api);
