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
      el.textContent = "Online · server reachable";
      el.style.color = "#027a48";
    } catch {
      el.textContent = "Offline · cannot load Rx from server";
      el.style.color = "#b42318";
    }
  }
  tick();
  setInterval(tick, 8000);
})();

const params = new URLSearchParams(location.search);
const preset = params.get("token");
if (preset) document.querySelector('[name="token"]').value = preset;

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = new FormData(e.target).get("token");
  const err = document.getElementById("err");
  const box = document.getElementById("rx");
  err.hidden = true;
  box.hidden = true;
  try {
    const rx = await fetch(`${API}/prescriptions/share/${encodeURIComponent(token)}`).then(async (r) => {
      if (!r.ok) throw new Error((await r.json()).message || "Not found");
      return r.json();
    });
    box.hidden = false;
    box.innerHTML = `
      <h2 style="margin-top:0">${rx.patient.name}</h2>
      <p class="muted">${rx.patient.ageYears || "?"} yrs · ${rx.patient.sex || ""}</p>
      <p><strong>Doctor:</strong> ${rx.doctor.fullName}${rx.doctor.bmdcNumber ? ` (${rx.doctor.bmdcNumber})` : ""}</p>
      ${rx.chamber ? `<p><strong>Chamber:</strong> ${rx.chamber.name}</p>` : ""}
      ${rx.diagnosis ? `<p><strong>Diagnosis:</strong> ${rx.diagnosis}</p>` : ""}
      <h3>Medicines</h3>
      ${rx.lines
        .map(
          (l) => `<div class="med">
          <strong>${l.brand}</strong> ${l.strength || ""}<br/>
          <span class="muted">${l.generic || ""}</span><br/>
          ${[l.dose, l.frequency, l.duration].filter(Boolean).join(" · ")}
          ${l.instructions ? `<div>${l.instructions}</div>` : ""}
        </div>`
        )
        .join("")}
      ${rx.advice ? `<p><strong>Advice:</strong> ${rx.advice}</p>` : ""}
      <p class="muted">Signed ${rx.signedAt ? new Date(rx.signedAt).toLocaleString() : ""} · v${rx.version}</p>
    `;
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
  }
});
