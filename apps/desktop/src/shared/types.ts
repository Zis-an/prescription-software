export type SyncState = "offline" | "syncing" | "online" | "error";

export interface AppInfo {
  name: string;
  version: string;
  platform: NodeJS.Platform;
  isDesktop: true;
  electronVersion: string;
  entry: string;
}

export interface SyncStatus {
  state: SyncState;
  pendingOps: number;
  lastSyncedAt: string | null;
  message?: string;
}

export interface PrintOptions {
  silent?: boolean;
  printBackground?: boolean;
  deviceName?: string;
}

/** API exposed to the renderer via contextBridge */
export interface ClinicalOSDesktopApi {
  getAppInfo: () => Promise<AppInfo>;
  getDataPath: () => Promise<string>;
  getSyncStatus: () => Promise<SyncStatus>;
  reportSyncStatus: (status: SyncStatus) => Promise<void>;
  print: (options?: PrintOptions) => Promise<boolean>;
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    clinicalOSDesktop: ClinicalOSDesktopApi;
  }
}

export {};
