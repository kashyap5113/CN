// Pure JS traffic visualizations using Chart.js and periodic data refresh.
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Chart === 'undefined') return;

  const labels = ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25'];

  const cssValue = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();

  const getThemePalette = () => ({
    text: cssValue('--text') || '#0f172a',
    muted: cssValue('--muted') || '#64748b',
    border: cssValue('--border') || '#e2e8f0',
    accent: cssValue('--accent') || '#38bdf8',
    primary: cssValue('--primary') || '#1e293b',
    danger: cssValue('--danger') || '#ef4444'
  });

  const axisOptions = (palette) => ({
    ticks: { color: palette.muted, font: { weight: '600' } },
    grid: { color: palette.border }
  });

  const createCharts = () => {
    const palette = getThemePalette();

    const bandwidth = new Chart(document.getElementById('bandwidthChart'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Mbps',
          data: [42, 55, 49, 63, 58, 61],
          borderColor: palette.accent,
          backgroundColor: 'rgba(56,189,248,0.2)',
          pointBackgroundColor: palette.accent,
          pointBorderColor: palette.accent,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        plugins: {
          legend: { labels: { color: palette.text, font: { weight: '600' } } }
        },
        scales: {
          x: axisOptions(palette),
          y: axisOptions(palette)
        }
      }
    });

    const packets = new Chart(document.getElementById('packetChart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Packets/s',
          data: [1200, 1500, 1320, 1700, 1650, 1580],
          backgroundColor: palette.primary
        }]
      },
      options: {
        plugins: {
          legend: { labels: { color: palette.text, font: { weight: '600' } } }
        },
        scales: {
          x: axisOptions(palette),
          y: axisOptions(palette)
        }
      }
    });

    const protocol = new Chart(document.getElementById('protocolChart'), {
      type: 'doughnut',
      data: {
        labels: ['TCP', 'UDP', 'ICMP'],
        datasets: [{
          data: [65, 25, 10],
          backgroundColor: [palette.primary, palette.accent, palette.danger],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        plugins: {
          legend: { labels: { color: palette.text, font: { weight: '600' } } }
        }
      }
    });

    return { bandwidth, packets, protocol };
  };

  let charts = createCharts();

  // Re-create charts when theme changes so all text/grid/legend colors stay visible.
  const refreshChartsForTheme = () => {
    charts.bandwidth.destroy();
    charts.packets.destroy();
    charts.protocol.destroy();
    charts = createCharts();
  };

  const observer = new MutationObserver(() => refreshChartsForTheme());
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  setInterval(() => {
    charts.bandwidth.data.datasets[0].data = charts.bandwidth.data.datasets[0].data.map((value) => Math.max(20, value + (Math.random() * 10 - 5)));
    charts.packets.data.datasets[0].data = charts.packets.data.datasets[0].data.map((value) => Math.max(600, value + Math.round(Math.random() * 300 - 150)));

    const tcp = Math.round(55 + Math.random() * 20);
    const udp = Math.round(20 + Math.random() * 20);
    charts.protocol.data.datasets[0].data = [tcp, udp, Math.max(5, 100 - tcp - udp)];

    charts.bandwidth.update();
    charts.packets.update();
    charts.protocol.update();
  }, 4000);
});
