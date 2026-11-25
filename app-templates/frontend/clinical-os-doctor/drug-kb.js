/**
 * Clinical OS — DGDA drug knowledge base helpers (doctor)
 * Expects window.ClinicalOSDrugKB from ./data/dgda-drugs.js
 */
(function (global) {
  const PENICILLIN_RE =
    /\b(penicillin|amoxicillin|ampicillin|flucloxacillin|cloxacillin|piperacillin|benzathine|phenoxymethylpenicillin)\b/i;

  let colIndex = null;
  let byIdCache = null;

  function cols() {
    const kb = global.ClinicalOSDrugKB;
    return (
      (kb && kb.meta && kb.meta.cols) || [
        "id",
        "brand",
        "generic",
        "strength",
        "form",
        "company",
        "dar",
        "system",
        "useFor",
        "priceBdt",
      ]
    );
  }

  function indexOf() {
    if (colIndex) return colIndex;
    const c = cols();
    colIndex = {};
    c.forEach((name, i) => {
      colIndex[name] = i;
    });
    return colIndex;
  }

  function rowToDrug(row) {
    const ix = indexOf();
    const generic = row[ix.generic] || "";
    const form = row[ix.form] || "";
    const system = row[ix.system] || "";
    const tags = [system, form].filter(Boolean);
    if (PENICILLIN_RE.test(generic)) tags.push("penicillin");
    return {
      id: row[ix.id],
      brand: row[ix.brand] || "",
      generic,
      strength: row[ix.strength] || "",
      form,
      company: row[ix.company] || "",
      dar: row[ix.dar] || "",
      system,
      useFor: row[ix.useFor] || "",
      priceBdt: row[ix.priceBdt],
      tags,
    };
  }

  function ready() {
    return !!(global.ClinicalOSDrugKB && Array.isArray(global.ClinicalOSDrugKB.rows));
  }

  function meta() {
    return (global.ClinicalOSDrugKB && global.ClinicalOSDrugKB.meta) || { count: 0 };
  }

  function byId(id) {
    if (!ready() || !id) return null;
    if (!byIdCache) {
      byIdCache = new Map();
      const ix = indexOf();
      const rows = global.ClinicalOSDrugKB.rows;
      for (let i = 0; i < rows.length; i++) {
        byIdCache.set(rows[i][ix.id], i);
      }
    }
    const rowIndex = byIdCache.get(id);
    if (rowIndex == null) return null;
    return rowToDrug(global.ClinicalOSDrugKB.rows[rowIndex]);
  }

  function scoreRow(row, tokens, ix) {
    const brand = String(row[ix.brand] || "").toLowerCase();
    const generic = String(row[ix.generic] || "").toLowerCase();
    const strength = String(row[ix.strength] || "").toLowerCase();
    const form = String(row[ix.form] || "").toLowerCase();
    const company = String(row[ix.company] || "").toLowerCase();
    const dar = String(row[ix.dar] || "").toLowerCase();
    let score = 0;

    for (let t = 0; t < tokens.length; t++) {
      const token = tokens[t];
      if (brand === token) score += 120;
      else if (brand.startsWith(token)) score += 80;
      else if (brand.includes(token)) score += 45;

      if (generic === token) score += 100;
      else if (generic.startsWith(token)) score += 70;
      else if (generic.includes(token)) score += 40;

      if (strength.includes(token)) score += 15;
      if (form.includes(token)) score += 10;
      if (company.includes(token)) score += 8;
      if (dar.includes(token)) score += 20;
    }
    return score;
  }

  function searchLocal(query, opts) {
    if (!ready()) return [];
    const options = opts || {};
    const limit = options.limit || 12;
    const systemFilter = (options.system || "").toLowerCase();
    const q = String(query || "")
      .trim()
      .toLowerCase();
    const rows = global.ClinicalOSDrugKB.rows;
    const ix = indexOf();

    if (!q) {
      const out = [];
      for (let i = 0; i < rows.length && out.length < limit; i++) {
        if (systemFilter && String(rows[i][ix.system] || "").toLowerCase() !== systemFilter) continue;
        out.push(rowToDrug(rows[i]));
      }
      return out;
    }

    const tokens = q.split(/\s+/).filter(Boolean);
    const hits = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (systemFilter && String(row[ix.system] || "").toLowerCase() !== systemFilter) continue;
      const s = scoreRow(row, tokens, ix);
      if (s > 0) hits.push({ i, s, brand: String(row[ix.brand] || "") });
    }
    hits.sort((a, b) => b.s - a.s || a.brand.localeCompare(b.brand));
    return hits.slice(0, limit).map((h) => rowToDrug(rows[h.i]));
  }

  /** Sync local search (legacy). Prefer searchAsync when API ranking is enabled. */
  function search(query, opts) {
    return searchLocal(query, opts);
  }

  /**
   * Uses PostgreSQL-ranked API when CLINICAL_OS_API_URL is set; falls back to local DGDA pack.
   */
  async function searchAsync(query, opts) {
    const client = global.ClinicalOSApiClient;
    if (client && client.enabled()) {
      try {
        const remote = await client.searchMedicines(query, opts);
        if (Array.isArray(remote)) return remote;
      } catch (err) {
        console.warn("API medicine search failed; using local DGDA", err);
      }
    }
    return searchLocal(query, opts);
  }

  function label(drug) {
    if (!drug) return "—";
    const parts = [drug.brand || drug.generic || "Medicine"];
    if (drug.strength) parts.push(drug.strength);
    if (drug.form) parts.push("(" + drug.form + ")");
    return parts.join(" ");
  }

  global.ClinicalOSDrugAPI = {
    ready,
    meta,
    byId,
    search,
    searchAsync,
    searchLocal,
    label,
    rowToDrug,
  };
})(window);
