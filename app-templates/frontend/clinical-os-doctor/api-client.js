/**
 * Optional Clinical OS API bridge.
 * Set window.CLINICAL_OS_API_URL (or meta[name=clinical-os-api]) to enable ranked medicine search.
 */
(function (global) {
  function apiBase() {
    if (global.CLINICAL_OS_API_URL) return String(global.CLINICAL_OS_API_URL).replace(/\/$/, "");
    const meta = document.querySelector('meta[name="clinical-os-api"]');
    if (meta && meta.content) return String(meta.content).replace(/\/$/, "");
    return "";
  }

  async function searchMedicines(query, opts) {
    const base = apiBase();
    if (!base) return null;
    const options = opts || {};
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (options.system) params.set("system", options.system);
    params.set("limit", String(options.limit || 12));
    const res = await fetch(`${base}/medicines/search?${params.toString()}`);
    if (!res.ok) throw new Error("API medicine search failed");
    const rows = await res.json();
    return rows.map((m) => ({
      id: m.externalId || m.id,
      brand: m.brand,
      generic: m.generic,
      strength: m.strength || "",
      form: m.form || "",
      company: m.company || "",
      dar: m.dar || "",
      system: m.system || "",
      useFor: m.useFor || "",
      priceBdt: m.priceBdt,
      tags: [m.system, m.form].filter(Boolean),
      boostScore: m.boostScore,
      searchRank: m.searchRank,
      _source: "api",
    }));
  }

  global.ClinicalOSApiClient = {
    apiBase,
    searchMedicines,
    enabled: () => !!apiBase(),
  };
})(window);
