/**
 * Clinical OS — shared chrome, toasts, keyboard UX helpers + sync chip
 */
(function (global) {
  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function toast(message, type = "ok", ms = 2800) {
    let root = $("#toast-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "toast-root";
      document.body.appendChild(root);
    }
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.setAttribute("role", "status");
    el.textContent = message;
    root.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(6px)";
      el.style.transition = "160ms ease";
      setTimeout(() => el.remove(), 180);
    }, ms);
  }

  function formatPhone(p) {
    if (!p) return "—";
    return p;
  }

  function ageSex(p) {
    if (!p) return "";
    const sex = p.sex === "female" ? "F" : p.sex === "male" ? "M" : "—";
    return `${p.ageYears}y · ${sex}`;
  }

  function syncLabel() {
    if (global.ClinicalOSSync) return ClinicalOSSync.labelForChip();
    const db = ClinicalOSDB.ensure();
    return db.session.syncState === "online" ? "Online · synced" : "Offline";
  }

  function syncDotClass(status) {
    if (!status) return "";
    if (status.state === "online" && status.pendingOps === 0) return "ok";
    if (status.state === "syncing") return "syncing";
    return "warn";
  }

  function renderChrome(active) {
    const db = ClinicalOSDB.ensure();
    const chamber = ClinicalOSDB.activeChamber();
    const doctor = db.doctor;
    const sync = syncLabel();

    const header = document.createElement("header");
    header.className = "app-header";
    header.innerHTML = `
      <div class="brand" aria-label="Clinical OS">
        <div class="brand-mark" aria-hidden="true">
          <img src="assets/logo.svg" alt="" width="32" height="32" />
        </div>
        <div class="brand-text">
          <strong>Clinical OS</strong>
          <span>Unified Clinical Practice</span>
        </div>
      </div>
      <nav class="nav" aria-label="Primary">
        <a href="workbench.html" data-nav="workbench">Workbench</a>
        <a href="patients.html" data-nav="patients">Patients</a>
        <a href="queue.html" data-nav="queue">Queue</a>
      </nav>
      <div class="header-meta">
        <div class="chamber-pill">
          <strong>${chamber.name}</strong>
          <span>${doctor.name} · BM&amp;DC ${doctor.bmdc}</span>
        </div>
        <div class="status-chip" id="sync-chip" title="Online / offline sync">
          <span class="dot" aria-hidden="true"></span>
          <span id="sync-chip-label">${sync}</span>
        </div>
        <button type="button" class="btn btn-sm btn-ghost" id="sync-now-btn" style="color:#dff7ee;border-color:rgba(255,255,255,.28)">Sync now</button>
        <a class="btn btn-sm btn-ghost" href="login.html" style="color:#dff7ee;border-color:rgba(255,255,255,.28)">Sign out</a>
      </div>
    `;

    header.querySelectorAll("[data-nav]").forEach((a) => {
      if (a.getAttribute("data-nav") === active) a.classList.add("active");
    });

    document.body.prepend(header);

    const chip = header.querySelector("#sync-chip");
    const label = header.querySelector("#sync-chip-label");
    const syncBtn = header.querySelector("#sync-now-btn");

    if (global.ClinicalOSSync) {
      ClinicalOSSync.subscribe((st) => {
        if (label) label.textContent = ClinicalOSSync.labelForChip(st);
        if (chip) {
          chip.dataset.state = st.state;
          chip.title = st.message || ClinicalOSSync.labelForChip(st);
          chip.classList.toggle("is-online", st.state === "online" && st.pendingOps === 0);
          chip.classList.toggle("is-pending", st.pendingOps > 0);
          chip.classList.toggle("is-offline", st.state === "offline");
        }
      });
      syncBtn?.addEventListener("click", async () => {
        toast("Syncing…", "ok", 1200);
        const result = await ClinicalOSSync.flush();
        if (result.error) toast(result.error, "err");
        else if (result.flushed)
          toast(`Synced ${result.flushed} change(s)`, "ok");
        else if (result.remaining)
          toast(`Still offline · ${result.remaining} pending`, "err");
        else toast("Already in sync", "ok");
      });
    }
  }

  function bindGlobalKeys() {
    document.addEventListener("keydown", (e) => {
      const tag = (e.target && e.target.tagName) || "";
      const typing = /INPUT|TEXTAREA|SELECT/.test(tag);

      if (e.key === "/" && !typing) {
        e.preventDefault();
        const search = document.querySelector("[data-global-search]");
        if (search) search.focus();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && !typing) {
        e.preventDefault();
        location.href = "patients.html";
      }
    });
  }

  function requireSession() {
    ClinicalOSDB.ensure();
  }

  function initSyncEngine() {
    if (!global.ClinicalOSSync) return;
    ClinicalOSSync.start(8000);
  }

  function initPage(activeNav) {
    requireSession();
    if (activeNav) renderChrome(activeNav);
    bindGlobalKeys();
    initSyncEngine();
  }

  global.ClinicalOSApp = {
    $,
    toast,
    formatPhone,
    ageSex,
    renderChrome,
    initPage,
    syncDotClass,
  };
})(window);
