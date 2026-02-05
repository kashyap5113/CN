// Threat alerts and blocked devices data rendering.
document.addEventListener('DOMContentLoaded', () => {
  const alertsContainer = document.getElementById('alertsContainer');
  const blockedContainer = document.getElementById('blockedContainer');

  let alerts = [];
  let blockedDevices = [];

  async function fetchAlerts() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/alerts');
      const data = await res.json();
      alerts = data.alerts || [];
      renderAlerts();
    } catch (e) {
      if (alertsContainer) alertsContainer.innerHTML = '<p>Failed to load alerts from backend.</p>';
    }
  }

  async function fetchBlocked() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/blocked');
      const data = await res.json();
      blockedDevices = data.blocked || [];
      renderBlocked();
    } catch (e) {
      if (blockedContainer) blockedContainer.innerHTML = '<p>Failed to load blocked devices from backend.</p>';
    }
  }

  function renderAlerts() {
    if (alertsContainer) {
      alertsContainer.innerHTML = alerts
        .map(
          (alert, index) => `
          <article class="alert-card severity-${(alert.severity || '').toLowerCase()}" style="animation-delay:${index * 0.12}s">
            <h3>${alert.attack || alert.type || 'Alert'}</h3>
            <p><strong>Source IP:</strong> ${alert.sourceIp || alert.ip || ''}</p>
            <p><strong>Time:</strong> ${alert.time || ''}</p>
            <p><strong>Severity:</strong> ${alert.severity || ''}</p>
          </article>`
        )
        .join('');
    }
  }

  function renderBlocked() {
    if (blockedContainer) {
      blockedContainer.innerHTML = blockedDevices
        .map(
          (device, index) => `
          <article class="blocked-item">
            <div>
              <p><strong>IP:</strong> ${device.ip}</p>
              <p><strong>MAC:</strong> ${device.mac}</p>
            </div>
            <button class="btn btn-primary" data-index="${index}">Unblock</button>
          </article>`
        )
        .join('');
    }
  }

  if (blockedContainer) {
    blockedContainer.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-index]');
      if (!button) return;
      const index = Number(button.dataset.index);
      const selected = blockedDevices[index];
      const confirmed = confirm(`Unblock ${selected.ip} (${selected.mac})?`);
      if (!confirmed) return;
      // Optionally implement unblock API if backend supports it
      // For now, just refresh list
      fetchBlocked();
    });
  }
});
