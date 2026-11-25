/** Shared sync status badge for Vite panels — probes API /health + /sync/status */
export function mountSyncBadge(el, apiBase) {
  const base = apiBase || "http://localhost:3001";
  const root = typeof el === "string" ? document.querySelector(el) : el;
  if (!root) return;

  async function tick() {
    let online = false;
    let msg = "Offline";
    try {
      const h = await fetch(`${base}/health`, { signal: AbortSignal.timeout(2000) });
      online = h.ok;
      if (online) {
        const s = await fetch(`${base}/sync/status`).then((r) => r.json());
        msg = s.ready ? "Online · sync ready" : "Online · sync degraded";
      }
    } catch {
      online = false;
      msg = "Offline · API unreachable";
    }
    root.textContent = msg;
    root.dataset.online = online ? "1" : "0";
    root.style.color = online ? "#027a48" : "#b42318";
  }

  tick();
  setInterval(tick, 8000);
}
