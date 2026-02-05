// Dummy device inventory rendered directly in table rows.
document.addEventListener('DOMContentLoaded', () => {
  const deviceTableBody = document.getElementById('deviceTableBody');
  if (!deviceTableBody) return;

  const devices = [
    { name: 'Faculty-PC-01', ip: '192.168.1.10', mac: '00:1A:2B:3C:4D:11', status: 'Active' },
    { name: 'Lab-Switch-03', ip: '192.168.1.14', mac: '00:1A:2B:3C:4D:22', status: 'Idle' },
    { name: 'Unknown-Device', ip: '192.168.1.66', mac: '00:1A:2B:3C:4D:99', status: 'Risk' },
    { name: 'Admin-Laptop', ip: '192.168.1.7', mac: '00:1A:2B:3C:4D:44', status: 'Active' }
  ];

  const statusClassMap = {
    Active: 'status-active',
    Idle: 'status-idle',
    Risk: 'status-risk'
  };

  const renderDevices = () => {
    deviceTableBody.innerHTML = devices
      .map(
        (device, index) => `
        <tr>
          <td>${device.name}</td>
          <td>${device.ip}</td>
          <td>${device.mac}</td>
          <td><span class="status-pill ${statusClassMap[device.status]}">${device.status}</span></td>
          <td><button class="btn btn-danger" data-index="${index}">Block</button></td>
        </tr>`
      )
      .join('');
  };

  renderDevices();

  deviceTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-index]');
    if (!button) return;

    const device = devices[Number(button.dataset.index)];
    alert(`Device ${device.name} (${device.ip}) has been marked as blocked.`);
    device.status = 'Risk';
    renderDevices();
  });
});
