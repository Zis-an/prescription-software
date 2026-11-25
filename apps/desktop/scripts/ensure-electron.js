/**
 * Ensures the Electron binary is extracted after npm install.
 * Some environments leave only partial files under node_modules/electron/dist.
 */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const electronDir = path.join(__dirname, "..", "node_modules", "electron");
const exe = path.join(electronDir, "dist", process.platform === "win32" ? "electron.exe" : "electron");

if (fs.existsSync(exe)) {
  process.exit(0);
}

console.log("Electron binary missing — running electron/install.js …");
execFileSync(process.execPath, [path.join(electronDir, "install.js")], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});

if (!fs.existsSync(exe)) {
  console.error("Electron binary still missing after install. Try: npm rebuild electron");
  process.exit(1);
}
