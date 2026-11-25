(function () {
  const aside = document.querySelector("aside[data-nav]");
  if (!aside) return;
  const active = aside.getAttribute("data-nav");
  aside.innerHTML = `
    <div class="brand-row">
      <img src="assets/logo.jpg" alt="" width="36" height="36" />
      <h1>Clinical OS Admin</h1>
    </div>
    <a href="dashboard.html" data-id="dashboard">Dashboard</a>
    <a href="doctors.html" data-id="doctors">Doctors</a>
    <a href="chambers.html" data-id="chambers">Chambers</a>
    <a href="drug-kb.html" data-id="drug-kb">Drug KB</a>
    <a href="audit-logs.html" data-id="audit-logs">Audit logs</a>
    <a href="settings.html" data-id="settings">Settings</a>
  `;
  const link = aside.querySelector(`[data-id="${active}"]`);
  if (link) link.classList.add("active");
})();
