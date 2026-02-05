// Pure JS traffic visualizations using Chart.js and periodic data refresh.
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Chart === 'undefined') return;

  const labels = ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25'];

  const bandwidthChart = new Chart(document.getElementById('bandwidthChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Mbps',
        data: [42, 55, 49, 63, 58, 61],
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56,189,248,0.2)',
        fill: true,
        tension: 0.3
      }]
    }
  });

  const packetChart = new Chart(document.getElementById('packetChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Packets/s',
        data: [1200, 1500, 1320, 1700, 1650, 1580],
        backgroundColor: '#1e293b'
      }]
    }
  });

  const protocolChart = new Chart(document.getElementById('protocolChart'), {
    type: 'doughnut',
    data: {
      labels: ['TCP', 'UDP', 'ICMP'],
      datasets: [{
        data: [65, 25, 10],
        backgroundColor: ['#1e293b', '#38bdf8', '#ef4444']
      }]
    }
  });

  setInterval(() => {
    bandwidthChart.data.datasets[0].data = bandwidthChart.data.datasets[0].data.map((v) => Math.max(20, v + (Math.random() * 10 - 5)));
    packetChart.data.datasets[0].data = packetChart.data.datasets[0].data.map((v) => Math.max(600, v + Math.round(Math.random() * 300 - 150)));

    const tcp = Math.round(55 + Math.random() * 20);
    const udp = Math.round(20 + Math.random() * 20);
    protocolChart.data.datasets[0].data = [tcp, udp, Math.max(5, 100 - tcp - udp)];

    bandwidthChart.update();
    packetChart.update();
    protocolChart.update();
  }, 4000);
});
