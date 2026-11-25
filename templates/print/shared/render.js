/**
 * Unbound template renderer — vanilla JS, zero dependencies.
 * Swap this for Handlebars/Liquid/React later; placeholders stay the same.
 *
 * Usage:
 *   const html = PadRender.render(templateHtml, data, labels, options)
 *   PadRender.mount(element, templateHtml, data, labels, options)
 */
(function (global) {
  const get = (obj, path) => {
    if (!path) return undefined;
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  };

  const escapeHtml = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const formatDate = (iso, locale) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return escapeHtml(iso);
    try {
      return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  };

  const sexLabel = (sex, labels) => labels[sex] || sex || "";

  function medRows(meds, labels, locale) {
    return (meds || [])
      .map((m) => {
        const instr =
          locale === "bn"
            ? m.instructionBn || m.instruction || ""
            : m.instruction || m.instructionBn || "";
        const bnExtra =
          locale === "en" && m.instructionBn
            ? `<span class="med-bn i18n-bn-only">${escapeHtml(m.instructionBn)}</span>`
            : "";
        return `<tr>
          <td>${escapeHtml(m.lineNo)}</td>
          <td>
            <div class="med-name">${escapeHtml(m.genericName)} ${escapeHtml(m.strength)}</div>
            <div class="med-brand">${escapeHtml(m.form)}${m.brandName ? " · " + escapeHtml(m.brandName) : ""}</div>
            <div class="med-sig">${escapeHtml(m.dose)} · ${escapeHtml(m.frequency)} · ${escapeHtml(m.duration)}${m.route ? " · " + escapeHtml(m.route) : ""}</div>
            ${instr ? `<div class="med-sig">${escapeHtml(instr)}</div>` : ""}
            ${m.prnMax ? `<div class="med-sig muted">${escapeHtml(m.prnMax)}</div>` : ""}
            ${bnExtra}
          </td>
          <td>${escapeHtml(m.quantity || "")}</td>
        </tr>`;
      })
      .join("");
  }

  function applyAccent(root, data) {
    const accent = get(data, "chamber.padAccent");
    if (accent) root.style.setProperty("--pad-accent", accent);
  }

  function fill(root, data, labels, options) {
    const locale = options.locale || get(data, "meta.locale") || "en";
    const paper = options.paper || get(data, "meta.paper") || "a5";

    root.classList.remove("a4", "a5", "hide-bn", "hide-en");
    root.classList.add(paper);
    root.classList.add(locale === "bn" ? "hide-en" : "hide-bn");
    applyAccent(root, data);

    root.querySelectorAll("[data-text]").forEach((el) => {
      const path = el.getAttribute("data-text");
      let val = get(data, path);
      if (path === "rx.authoredOn") val = formatDate(val, locale);
      if (path === "patient.sex") val = sexLabel(val, labels);
      if (path === "patient.allergies" && !val) val = labels.no_allergy;
      el.textContent = val == null ? "" : String(val);
    });

    root.querySelectorAll("[data-label]").forEach((el) => {
      const key = el.getAttribute("data-label");
      el.textContent = labels[key] || key;
    });

    root.querySelectorAll("[data-attr]").forEach((el) => {
      const spec = el.getAttribute("data-attr"); // e.g. href:rx.verifyUrl
      const [attr, path] = spec.split(":");
      const val = get(data, path);
      if (val != null) el.setAttribute(attr, String(val));
    });

    const medBody = root.querySelector("[data-meds]");
    if (medBody) medBody.innerHTML = medRows(data.medications, labels, locale);

    const adviceEl = root.querySelector("[data-advice]");
    if (adviceEl) {
      const advice =
        locale === "bn"
          ? get(data, "rx.adviceBn") || get(data, "rx.advice") || ""
          : get(data, "rx.advice") || get(data, "rx.adviceBn") || "";
      adviceEl.textContent = advice;
    }

    const qr = root.querySelector("[data-qr]");
    if (qr) {
      const payload = get(data, "rx.qrPayload") || get(data, "rx.verifyUrl") || "";
      qr.setAttribute("title", payload);
      // Placeholder square; replace with any QR lib in your app (qrcode, etc.)
      qr.innerHTML = payload
        ? `<div style="width:68px;height:68px;display:flex;align-items:center;justify-content:center;background:#f5f5f5;font-size:9px;word-break:break-all;padding:4px;">QR</div>`
        : "";
    }
  }

  function mount(host, templateHtml, data, labels, options = {}) {
    host.innerHTML = templateHtml;
    const root = host.querySelector(".sheet") || host.firstElementChild;
    fill(root, data, labels, options);
    return root;
  }

  global.PadRender = { mount, fill, get, escapeHtml, medRows };
})(typeof window !== "undefined" ? window : globalThis);
