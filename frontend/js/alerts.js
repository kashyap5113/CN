// Threat alerts and blocked devices data rendering.
document.addEventListener('DOMContentLoaded', () => {
  const alertsContainer = document.getElementById('alertsContainer');
  const blockedContainer = document.getElementById('blockedContainer');

  const alerts = [
    { attack: 'Port Scanning', sourceIp: '172.16.0.12', time: '10:14 AM', severity: 'Low' },
    { attack: 'ARP Spoofing', sourceIp: '172.16.0.39', time: '10:19 AM', severity: 'Medium' },
    { attack: 'DDoS Attempt', sourceIp: '203.10.88.4', time: '10:31 AM', severity: 'High' }
  ];

  let blockedDevices = [
    { ip: '192.168.1.66', mac: '00:1A:2B:3C:4D:99' },
    { ip: '192.168.1.72', mac: '00:1A:2B:3C:4D:88' }
  ];

  if (alertsContainer) {
    alertsContainer.innerHTML = alerts
      .map(
        (alert, index) => `
        <article class="alert-card severity-${alert.severity.toLowerCase()}" style="animation-delay:${index * 0.12}s">
          <h3>${alert.attack}</h3>
          <p><strong>Source IP:</strong> ${alert.sourceIp}</p>
          <p><strong>Time:</strong> ${alert.time}</p>
          <p><strong>Severity:</strong> ${alert.severity}</p>
        </article>`
      )
      .join('');
  }

  if (blockedContainer) {
    const renderBlocked = () => {
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
    };

    renderBlocked();

    blockedContainer.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-index]');
      if (!button) return;

      const index = Number(button.dataset.index);
      const selected = blockedDevices[index];
      const confirmed = confirm(`Unblock ${selected.ip} (${selected.mac})?`);
      if (!confirmed) return;

      blockedDevices = blockedDevices.filter((_, itemIndex) => itemIndex !== index);
      renderBlocked();
    });
  }
});
