const { contextBridge } = require("electron");

// Expose only safe, explicit APIs later (print, offline sync status, etc.)
contextBridge.exposeInMainWorld("clinicalOSDesktop", {
  platform: process.platform,
  isDesktop: true,
});
