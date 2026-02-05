function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString();
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Chart === 'undefined') return;

  const MAX_POINTS = 10;

  const labels = [];

  const bandwidthData = [];
  const packetData = [];

  const bandwidthChart = new Chart(
    document.getElementById('bandwidthChart'),
    {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Mbps',
            data: bandwidthData,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56,189,248,0.25)',
            fill: true,
            tension: 0.4,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        animation: false,
        scales: {
          y: { beginAtZero: true }
        }
      }
    }
  );

  const packetChart = new Chart(
    document.getElementById('packetChart'),
    {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Packets/s',
            data: packetData,
            backgroundColor: '#1e293b'
          }
        ]
      },
      options: {
        responsive: true,
        animation: false,
        scales: {
          y: { beginAtZero: true }
        }
      }
    }
  );

  const protocolChart = new Chart(
    document.getElementById('protocolChart'),
    {
      type: 'doughnut',
      data: {
        labels: ['TCP', 'UDP', 'ICMP'],
        datasets: [
          {
            data: [60, 30, 10],
            backgroundColor: ['#1e293b', '#38bdf8', '#ef4444']
          }
        ]
      },
      options: {
        responsive: true
      }
    }
  );

  function updateCharts() {
    const time = getCurrentTime();

    const bandwidth = Math.floor(40 + Math.random() * 30); // Mbps
    const packets = Math.floor(800 + Math.random() * 700); // packets/s

    labels.push(time);
    bandwidthData.push(bandwidth);
    packetData.push(packets);

    if (labels.length > MAX_POINTS) {
      labels.shift();
      bandwidthData.shift();
      packetData.shift();
    }

    const tcp = Math.floor(50 + Math.random() * 25);
    const udp = Math.floor(20 + Math.random() * 20);
    const icmp = Math.max(5, 100 - tcp - udp);

    protocolChart.data.datasets[0].data = [tcp, udp, icmp];

    bandwidthChart.update();
    packetChart.update();
    protocolChart.update();
  }

  // Initial fill
  for (let i = 0; i < 5; i++) updateCharts();

  // Live update every 3 seconds
  setInterval(updateCharts, 3000);
});
