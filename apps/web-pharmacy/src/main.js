const API =
  (typeof window !== "undefined" && window.CLINICAL_OS_API_URL) ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";

(function syncBadge() {
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;bottom:12px;right:12px;background:#fff;border:1px solid #d7e2dd;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:600;z-index:50";
  document.body.appendChild(el);
  async function tick() {
    try {
      await fetch(`${API}/health`, { signal: AbortSignal.timeout(2000) }).then((r) => {
        if (!r.ok) throw new Error("down");
      });
      el.textContent = "Online · verify API ready";
      el.style.color = "#027a48";
    } catch {
      el.textContent = "Offline · verify API unreachable";
      el.style.color = "#b42318";
    }
  }
  tick();
  setInterval(tick, 8000);
})();

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = new FormData(e.target).get("code");
  const err = document.getElementById("err");
  const out = document.getElementById("out");
  err.hidden = true;
  out.hidden = true;
  try {
    const data = await fetch(`${API}/prescriptions/verify/${encodeURIComponent(code)}`).then(async (r) => {
      if (!r.ok) throw new Error((await r.json()).message || "Invalid code");
      return r.json();
    });
    out.hidden = false;
    out.innerHTML = `
      <p class="${data.valid && data.isLatest ? "ok" : "bad"}">
        ${data.valid && data.isLatest ? "VALID — latest signed version" : `Status: ${data.status}`}
      </p>
      <p><strong>Patient:</strong> ${data.patient.name}</p>
      <p><strong>Doctor:</strong> ${data.doctor.fullName}${data.doctor.bmdcNumber ? ` (${data.doctor.bmdcNumber})` : ""}</p>
      <p class="muted">Version ${data.version} · signed ${data.signedAt ? new Date(data.signedAt).toLocaleString() : ""}</p>
      <h3>Lines</h3>
      ${data.lines
        .map((l) => `<div class="med"><strong>${l.brand}</strong> ${l.strength || ""} · ${l.dose || ""} ${l.frequency || ""}</div>`)
        .join("")}
    `;
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
  }
});
