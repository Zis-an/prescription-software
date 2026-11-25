/**
 * Clinical OS — Online / Offline sync engine (key product path)
 *
 * - Detects connectivity via navigator.onLine + API /health
 * - Queues mutations in localStorage outbox while offline
 * - Flushes outbox to POST /sync/push when online
 * - Updates sync chip subscribers (status + pending count)
 */
(function (global) {
  const OUTBOX_KEY = "clinicalos.sync.outbox.v1";
  const META_KEY = "clinicalos.sync.meta.v1";
  const listeners = new Set();

  function apiBase() {
    if (global.CLINICAL_OS_API_URL) return String(global.CLINICAL_OS_API_URL).replace(/\/$/, "");
    const meta = document.querySelector('meta[name="clinical-os-api"]');
    if (meta && meta.content) return String(meta.content).replace(/\/$/, "");
    return "http://localhost:3001";
  }

  function loadOutbox() {
    try {
      return JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveOutbox(items) {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  }

  function loadMeta() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveMeta(meta) {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  }

  function uuid() {
    if (global.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "op-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  let status = {
    state: "offline", // online | offline | syncing
    pendingOps: 0,
    lastSyncedAt: null,
    lastError: null,
    message: "Starting sync…",
    apiReachable: false,
  };

  function emit() {
    status.pendingOps = loadOutbox().length;
    const meta = loadMeta();
    if (meta.lastSyncedAt) status.lastSyncedAt = meta.lastSyncedAt;
    listeners.forEach((fn) => {
      try {
        fn({ ...status });
      } catch (_) {
        /* ignore */
      }
    });
    // Mirror into demo session for legacy chrome
    if (global.ClinicalOSDB && ClinicalOSDB.ensure) {
      const db = ClinicalOSDB.ensure();
      db.session.syncState = status.state === "online" && status.pendingOps === 0 ? "online" : "offline";
      db.session.syncPending = status.pendingOps;
      db.session.syncMessage = status.message;
      ClinicalOSDB.save(db);
    }
    // Desktop IPC bridge if present
    if (global.clinicalOSDesktop && clinicalOSDesktop.reportSyncStatus) {
      clinicalOSDesktop.reportSyncStatus({
        state: status.state,
        pendingOps: status.pendingOps,
        lastSyncedAt: status.lastSyncedAt,
        message: status.message,
      });
    }
  }

  function getStatus() {
    status.pendingOps = loadOutbox().length;
    return { ...status };
  }

  function subscribe(fn) {
    listeners.add(fn);
    fn(getStatus());
    return () => listeners.delete(fn);
  }

  /** Enqueue a mutation. Returns op id. */
  function enqueue(type, payload) {
    const items = loadOutbox();
    const op = {
      id: uuid(),
      type,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    items.push(op);
    saveOutbox(items);
    status.message =
      status.state === "online"
        ? `Queued ${items.length} pending — syncing…`
        : `Offline · ${items.length} pending`;
    emit();
    if (status.apiReachable) {
      flush().catch(() => {});
    }
    return op.id;
  }

  async function probe() {
    const base = apiBase();
    if (!base) {
      status.apiReachable = false;
      return false;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      status.apiReachable = false;
      return false;
    }
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(`${base}/health`, { signal: ctrl.signal });
      clearTimeout(t);
      status.apiReachable = res.ok;
      return res.ok;
    } catch {
      status.apiReachable = false;
      return false;
    }
  }

  async function flush() {
    const items = loadOutbox();
    if (!items.length) {
      const ok = await probe();
      status.state = ok ? "online" : "offline";
      status.message = ok ? "Online · synced" : "Offline · waiting for network";
      status.lastError = null;
      emit();
      return { flushed: 0, remaining: 0 };
    }

    const ok = await probe();
    if (!ok) {
      status.state = "offline";
      status.message = `Offline · ${items.length} pending`;
      emit();
      return { flushed: 0, remaining: items.length };
    }

    status.state = "syncing";
    status.message = `Syncing ${items.length} op(s)…`;
    emit();

    const token = localStorage.getItem("cos.sync.token") || localStorage.getItem("cos.admin.token") || "";
    try {
      const res = await fetch(`${apiBase()}/sync/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ops: items }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || "Sync push failed");
      }

      const body = await res.json();
      const acked = new Set(body.ackedIds || []);
      const remaining = items.filter((op) => !acked.has(op.id));
      // bump attempts on failed
      const failed = (body.errors || []).map((e) => e.id);
      remaining.forEach((op) => {
        if (failed.includes(op.id)) op.attempts = (op.attempts || 0) + 1;
      });
      saveOutbox(remaining);

      const now = new Date().toISOString();
      saveMeta({ lastSyncedAt: now, lastAckCount: acked.size });
      status.lastSyncedAt = now;
      status.lastError = body.errors && body.errors.length ? body.errors[0].message : null;
      status.state = remaining.length ? "online" : "online";
      status.message = remaining.length
        ? `Online · ${remaining.length} pending (retry)`
        : "Online · synced";
      emit();
      return { flushed: acked.size, remaining: remaining.length };
    } catch (err) {
      status.state = "offline";
      status.lastError = err.message || String(err);
      status.message = `Sync failed · ${items.length} pending`;
      emit();
      return { flushed: 0, remaining: items.length, error: status.lastError };
    }
  }

  async function tick() {
    await flush();
  }

  function start(intervalMs) {
    const ms = intervalMs || 8000;
    tick();
    const id = setInterval(tick, ms);
    global.addEventListener("online", () => tick());
    global.addEventListener("offline", () => {
      status.state = "offline";
      status.apiReachable = false;
      status.message = `Offline · ${loadOutbox().length} pending`;
      emit();
    });
    return () => clearInterval(id);
  }

  function labelForChip(s) {
    const st = s || getStatus();
    if (st.state === "syncing") return `Syncing · ${st.pendingOps}`;
    if (st.state === "online" && st.pendingOps === 0) return "Online · synced";
    if (st.state === "online") return `Online · ${st.pendingOps} pending`;
    return st.pendingOps ? `Offline · ${st.pendingOps} pending` : "Offline";
  }

  global.ClinicalOSSync = {
    enqueue,
    flush,
    tick,
    start,
    subscribe,
    getStatus,
    labelForChip,
    apiBase,
    OUTBOX_KEY,
  };
})(window);
