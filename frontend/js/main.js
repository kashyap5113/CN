// Shared frontend behavior for login, dashboard, and responsive navigation.
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const loadingOverlay = document.getElementById('loadingOverlay');

  if (localStorage.getItem('lanTheme') === 'dark') {
    document.body.classList.add('dark');
  }

  if (themeToggle) {
    themeToggle.textContent = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('lanTheme', isDark ? 'dark' : 'light');
      themeToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    });
  }

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  if (loadingOverlay) {
    setTimeout(() => loadingOverlay.classList.add('hide'), 1200);
  }

  // Login form validation for demo authentication.
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      const loginError = document.getElementById('loginError');

      if (username === 'admin' && password === 'admin123') {
        window.location.href = 'index.html';
      } else {
        loginError.textContent = 'Invalid credentials. Try admin / admin123.';
      }
    });
  }

  // Dashboard summary cards use static seed values (demo mode) with simulated UI-only fluctuations.
  const counts = {
    totalDevices: document.getElementById('totalDevices'),
    activeDevices: document.getElementById('activeDevices'),
    threatCount: document.getElementById('threatCount'),
    blockedCount: document.getElementById('blockedCount')
  };

  if (counts.totalDevices) {
    let dashboardData = { total: 28, active: 21, threats: 3, blocked: 4 };

    const renderDashboard = () => {
      counts.totalDevices.textContent = dashboardData.total;
      counts.activeDevices.textContent = dashboardData.active;
      counts.threatCount.textContent = dashboardData.threats;
      counts.blockedCount.textContent = dashboardData.blocked;
    };

    renderDashboard();

    const liveStatus = document.getElementById('liveStatus');
    setInterval(() => {
      dashboardData.active = Math.max(15, Math.min(28, dashboardData.active + (Math.random() > 0.5 ? 1 : -1)));
      dashboardData.threats = Math.max(0, Math.min(7, dashboardData.threats + (Math.random() > 0.7 ? 1 : -1)));
      renderDashboard();

      if (dashboardData.threats > 4) {
        liveStatus.textContent = '🔴 Threat Detected';
        liveStatus.className = 'status threat';
      } else {
        liveStatus.textContent = '🟢 Network Secure';
        liveStatus.className = 'status secure';
      }
    }, 3000);
  }
});
