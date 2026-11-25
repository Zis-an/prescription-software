const API =
  (typeof window !== "undefined" && window.CLINICAL_OS_API_URL) ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";

const state = {
  token: localStorage.getItem("cos.admin.token") || "",
  user: null,
};

async function refreshSyncBadge() {
  let el = document.getElementById("sync-badge");
  if (!el) {
    el = document.createElement("div");
    el.id = "sync-badge";
    el.style.cssText =
      "position:fixed;bottom:12px;right:12px;background:#fff;border:1px solid #d7e2dd;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:600;z-index:50;box-shadow:0 4px 14px rgba(0,0,0,.08)";
    document.body.appendChild(el);
  }
  try {
    const h = await fetch(`${API}/health`, { signal: AbortSignal.timeout(2000) });
    if (!h.ok) throw new Error("down");
    const s = await fetch(`${API}/sync/status`).then((r) => r.json());
    el.textContent = s.ready ? "Online · sync ready" : "Online · sync degraded";
    el.style.color = "#027a48";
  } catch {
    el.textContent = "Offline · API unreachable (sync paused)";
    el.style.color = "#b42318";
  }
}
refreshSyncBadge();
setInterval(refreshSyncBadge, 8000);

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || JSON.stringify(err));
  }
  if (res.status === 204) return null;
  return res.json();
}

function showApp(show) {
  document.getElementById("login-view").hidden = show;
  document.getElementById("app-view").hidden = !show;
}

async function bootSession() {
  if (!state.token) return showApp(false);
  try {
    state.user = await api("/auth/me");
    if (!["SUPER_ADMIN", "ADMIN"].includes(state.user.role)) {
      throw new Error("Admin role required");
    }
    document.getElementById("whoami").textContent = `${state.user.fullName} · ${state.user.role}`;
    showApp(true);
    await renderDashboard();
  } catch {
    state.token = "";
    localStorage.removeItem("cos.admin.token");
    showApp(false);
  }
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const errEl = document.getElementById("login-error");
  errEl.hidden = true;
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    state.token = data.accessToken;
    localStorage.setItem("cos.admin.token", state.token);
    await bootSession();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  }
});

document.getElementById("logout").addEventListener("click", () => {
  state.token = "";
  localStorage.removeItem("cos.admin.token");
  showApp(false);
});

document.querySelectorAll("aside .nav").forEach((btn) => {
  btn.addEventListener("click", async () => {
    document.querySelectorAll("aside .nav").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    document.querySelectorAll("main .view").forEach((v) => (v.hidden = true));
    document.getElementById(`view-${view}`).hidden = false;
    if (view === "dashboard") await renderDashboard();
    if (view === "users") await renderUsers();
    if (view === "chambers") await renderChambers();
    if (view === "medicines") await renderMedicines();
    if (view === "audit") await renderAudit();
  });
});

async function renderDashboard() {
  const el = document.getElementById("view-dashboard");
  const [users, chambers, medStats, audit] = await Promise.all([
    api("/users"),
    api("/chambers"),
    api("/medicines/stats"),
    api("/audit?take=5"),
  ]);
  const medTotal = medStats.reduce((n, s) => n + s._count._all, 0);
  el.innerHTML = `
    <div class="bar"><h2>Dashboard</h2></div>
    <div class="stats">
      <div class="stat"><div class="k">Users</div><div class="v">${users.length}</div></div>
      <div class="stat"><div class="k">Chambers</div><div class="v">${chambers.length}</div></div>
      <div class="stat"><div class="k">Medicines</div><div class="v">${medTotal}</div></div>
      <div class="stat"><div class="k">Recent audits</div><div class="v">${audit.length}</div></div>
    </div>
    <div class="card">
      <strong>Medicine systems</strong>
      <ul>${medStats.map((s) => `<li>${s.system || "Unknown"}: ${s._count._all}</li>`).join("")}</ul>
      <p class="muted">Search ranking is controlled only by SUPER_ADMIN on the Drug KB page.</p>
    </div>`;
}

async function renderUsers() {
  const el = document.getElementById("view-users");
  const users = await api("/users");
  const canSuper = state.user.role === "SUPER_ADMIN";
  el.innerHTML = `
    <div class="bar"><h2>Users</h2></div>
    <form id="create-user" class="card form-inline">
      <label>Name <input name="fullName" required /></label>
      <label>Email <input name="email" type="email" /></label>
      <label>Phone <input name="phone" /></label>
      <label>Password <input name="password" type="password" minlength="6" /></label>
      <label>Role
        <select name="role">
          ${canSuper ? '<option value="SUPER_ADMIN">SUPER_ADMIN</option>' : ""}
          <option value="ADMIN">ADMIN</option>
          <option value="DOCTOR" selected>DOCTOR</option>
          <option value="ASSISTANT">ASSISTANT</option>
          <option value="PATIENT">PATIENT</option>
          <option value="PHARMACIST">PHARMACIST</option>
        </select>
      </label>
      <button type="submit">Create user</button>
    </form>
    <table>
      <thead><tr><th>Name</th><th>Role</th><th>Email / Phone</th><th>Active</th><th></th></tr></thead>
      <tbody>
        ${users
          .map(
            (u) => `<tr>
            <td>${u.fullName}</td>
            <td><span class="badge">${u.role}</span></td>
            <td>${u.email || "—"}<br/><span class="muted small">${u.phone || ""}</span></td>
            <td>${u.isActive ? "yes" : "no"}</td>
            <td><button type="button" class="secondary" data-toggle="${u.id}" data-active="${u.isActive}">${
              u.isActive ? "Disable" : "Enable"
            }</button></td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;

  document.getElementById("create-user").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api("/users", {
      method: "POST",
      body: JSON.stringify({
        fullName: fd.get("fullName"),
        email: fd.get("email") || undefined,
        phone: fd.get("phone") || undefined,
        password: fd.get("password") || undefined,
        role: fd.get("role"),
      }),
    });
    await renderUsers();
  });

  el.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api(`/users/${btn.dataset.toggle}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: btn.dataset.active !== "true" }),
      });
      await renderUsers();
    });
  });
}

async function renderChambers() {
  const el = document.getElementById("view-chambers");
  const chambers = await api("/chambers");
  el.innerHTML = `
    <div class="bar"><h2>Chambers</h2></div>
    <form id="create-chamber" class="card form-inline">
      <label>Name <input name="name" required /></label>
      <label>Address <input name="address" /></label>
      <label>Fee (BDT) <input name="feeBdt" type="number" /></label>
      <button type="submit">Add chamber</button>
    </form>
    <table>
      <thead><tr><th>Name</th><th>Address</th><th>Fee</th><th>Active</th></tr></thead>
      <tbody>
        ${chambers
          .map(
            (c) => `<tr>
            <td>${c.name}</td>
            <td>${c.address || "—"}</td>
            <td>${c.feeBdt ?? "—"}</td>
            <td>${c.isActive ? "yes" : "no"}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;

  document.getElementById("create-chamber").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api("/chambers", {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        address: fd.get("address") || undefined,
        feeBdt: fd.get("feeBdt") ? Number(fd.get("feeBdt")) : undefined,
      }),
    });
    await renderChambers();
  });
}

async function renderMedicines(q = "") {
  const el = document.getElementById("view-medicines");
  const isSuper = state.user.role === "SUPER_ADMIN";
  const data = await api(`/medicines?q=${encodeURIComponent(q)}&take=80`);
  el.innerHTML = `
    <div class="bar">
      <h2>Drug KB ${isSuper ? "· Super Admin ranking" : ""}</h2>
      <form id="med-search" class="form-inline">
        <label>Search <input name="q" value="${q.replace(/"/g, "&quot;")}" placeholder="Brand / generic" /></label>
        <button type="submit">Search</button>
      </form>
    </div>
    <p class="muted">Order used by doctor search: <code>boost_score DESC</code>, then <code>search_rank ASC</code>, then brand.
      ${isSuper ? "Edit boost / rank below — only SUPER_ADMIN can save." : "View only for ADMIN (ranking locked)."}</p>
    <p class="muted">Showing ${data.items.length} of ${data.total}</p>
    <table>
      <thead>
        <tr>
          <th>Brand</th><th>Generic</th><th>Strength</th><th>Company</th>
          <th>Boost</th><th>Rank</th><th>Active</th>${isSuper ? "<th></th>" : ""}
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (m) => `<tr data-id="${m.id}">
            <td>${m.brand}</td>
            <td>${m.generic}</td>
            <td>${m.strength || ""}</td>
            <td>${m.company || ""}</td>
            <td>${
              isSuper
                ? `<input class="boost" type="number" value="${m.boostScore}" />`
                : m.boostScore
            }</td>
            <td>${
              isSuper
                ? `<input class="rank" type="number" value="${m.searchRank}" />`
                : m.searchRank
            }</td>
            <td>${m.isActive ? "yes" : "no"}</td>
            ${
              isSuper
                ? `<td class="row-actions"><button type="button" class="save-rank">Save</button></td>`
                : ""
            }
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;

  document.getElementById("med-search").addEventListener("submit", async (e) => {
    e.preventDefault();
    const qq = new FormData(e.target).get("q") || "";
    await renderMedicines(String(qq));
  });

  if (isSuper) {
    el.querySelectorAll(".save-rank").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const tr = btn.closest("tr");
        const id = tr.dataset.id;
        const boostScore = Number(tr.querySelector(".boost").value);
        const searchRank = Number(tr.querySelector(".rank").value);
        await api(`/medicines/${id}/ranking`, {
          method: "PATCH",
          body: JSON.stringify({ boostScore, searchRank }),
        });
        btn.textContent = "Saved";
        setTimeout(() => (btn.textContent = "Save"), 800);
      });
    });
  }
}

async function renderAudit() {
  const el = document.getElementById("view-audit");
  const rows = await api("/audit?take=100");
  el.innerHTML = `
    <div class="bar"><h2>Audit log</h2></div>
    <table>
      <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (r) => `<tr>
            <td>${new Date(r.createdAt).toLocaleString()}</td>
            <td>${r.actor?.fullName || "—"} <span class="muted small">${r.actor?.role || ""}</span></td>
            <td>${r.action}</td>
            <td>${r.entityType} ${r.entityId || ""}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}

bootSession();
