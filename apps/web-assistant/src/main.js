const API =
  (typeof window !== "undefined" && window.CLINICAL_OS_API_URL) ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";
let token = localStorage.getItem("cos.assistant.token") || "";
let me = null;

(function syncBadge() {
  const el = document.createElement("div");
  el.id = "sync-badge";
  el.style.cssText =
    "position:fixed;bottom:12px;right:12px;background:#fff;border:1px solid #d7e2dd;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:600;z-index:50";
  document.body.appendChild(el);
  async function tick() {
    try {
      const h = await fetch(`${API}/health`, { signal: AbortSignal.timeout(2000) });
      if (!h.ok) throw new Error("down");
      el.textContent = "Online · sync ready";
      el.style.color = "#027a48";
    } catch {
      el.textContent = "Offline · API unreachable";
      el.style.color = "#b42318";
    }
  }
  tick();
  setInterval(tick, 8000);
})();

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

async function boot() {
  if (!token) return;
  try {
    me = await api("/auth/me");
    if (!["ASSISTANT", "ADMIN", "SUPER_ADMIN", "DOCTOR"].includes(me.role)) {
      throw new Error("Assistant access required");
    }
    document.getElementById("login").hidden = true;
    document.getElementById("desk").hidden = false;
    document.getElementById("who").textContent = `${me.fullName} · ${me.role}`;
    const chambers = await api("/chambers");
    const sel = document.getElementById("chamber");
    sel.innerHTML = chambers.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
    await refreshQueue();
  } catch {
    token = "";
    localStorage.removeItem("cos.assistant.token");
  }
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const err = document.getElementById("login-error");
  err.hidden = true;
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
    });
    token = data.accessToken;
    localStorage.setItem("cos.assistant.token", token);
    await boot();
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
  }
});

async function refreshQueue() {
  const chamberId = document.getElementById("chamber").value;
  if (!chamberId) return;
  const rows = await api(`/queue?chamberId=${chamberId}`);
  document.getElementById("queue-body").innerHTML = rows
    .map(
      (r) => `<tr>
      <td>${r.serial}</td>
      <td>${r.patient.name}</td>
      <td>${r.patient.phone || "—"}</td>
      <td>${r.feeBdt ?? "—"}</td>
      <td>${r.status}</td>
      <td>
        <button type="button" data-id="${r.id}" data-status="current">Current</button>
        <button type="button" data-id="${r.id}" data-status="done">Done</button>
      </td>
    </tr>`
    )
    .join("");

  document.querySelectorAll("#queue-body button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api(`/queue/${btn.dataset.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: btn.dataset.status }),
      });
      await refreshQueue();
    });
  });
}

document.getElementById("refresh").addEventListener("click", refreshQueue);
document.getElementById("chamber").addEventListener("change", refreshQueue);

let searchTimer;
document.getElementById("pq").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const q = e.target.value.trim();
    if (q.length < 2) return;
    const patients = await api(`/patients?q=${encodeURIComponent(q)}`);
    document.getElementById("patient").innerHTML = patients
      .map((p) => `<option value="${p.id}">${p.name} · ${p.phone || "no phone"}</option>`)
      .join("");
  }, 250);
});

document.getElementById("add-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const patientId = document.getElementById("patient").value;
  const chamberId = document.getElementById("chamber").value;
  if (!patientId) return alert("Select a patient");
  await api("/queue", {
    method: "POST",
    body: JSON.stringify({
      chamberId,
      patientId,
      feeBdt: Number(fd.get("feeBdt")) || undefined,
      vitalsJson: {
        bp: fd.get("bp") || undefined,
        pulse: fd.get("pulse") || undefined,
      },
    }),
  });
  e.target.reset();
  await refreshQueue();
});

boot();
