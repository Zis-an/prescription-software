/** IPC channel names — keep main + preload in sync */
export const IpcChannels = {
  APP_INFO: "clinical-os:app-info",
  DATA_PATH: "clinical-os:data-path",
  PRINT: "clinical-os:print",
  SYNC_STATUS: "clinical-os:sync-status",
  REPORT_SYNC_STATUS: "clinical-os:report-sync-status",
  OPEN_EXTERNAL: "clinical-os:open-external",
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
