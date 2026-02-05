// Shared frontend behavior for login, dashboard, and responsive navigation.

document.addEventListener('DOMContentLoaded', () => {

  /* ===============================
     THEME & UI CONTROLS
  =============================== */

  const themeToggle = document.getElementById('themeToggle');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const loadingOverlay = document.getElementById('loadingOverlay');

  // Load saved theme
  if (localStorage.getItem('lanTheme') === 'dark') {
    document.body.classList.add('dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('lanTheme', isDark ? 'dark' : 'light');
      themeToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    });
  }

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  if (loadingOverlay) {
    setTimeout(() => loadingOverlay.classList.add('hide'), 1200);
  }

  /* ===============================
     LOGIN (DEMO AUTH)
  =============================== */

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

  /* ===============================
     DASHBOARD LIVE DATA
  =============================== */

  const counts = {
    totalDevices: document.getElementById('totalDevices'),
    activeDevices: document.getElementById('activeDevices'),
    threatCount: document.getElementById('threatCount'),
    blockedCount: document.getElementById('blockedCount')
  };

  const liveStatus = document.getElementById('liveStatus');

  // Only run dashboard logic if dashboard elements exist
  if (counts.totalDevices && counts.activeDevices) {

    async function updateDashboard() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/devices');
        if (!res.ok) throw new Error('Backend error');

        const data = await res.json();

        // Map backend fields EXACTLY
        counts.totalDevices.textContent = data.total ?? 0;
        counts.activeDevices.textContent = data.active ?? 0;
        counts.threatCount.textContent = data.risk ?? 0;
        counts.blockedCount.textContent = data.blocked ?? 0;

        if (liveStatus) {
          if ((data.risk ?? 0) > 0) {
            liveStatus.textContent = '🔴 Threat Detected';
            liveStatus.className = 'status threat';
          } else {
            liveStatus.textContent = '🟢 Network Secure';
            liveStatus.className = 'status secure';
          }
        }

      } catch (error) {
        console.error('Dashboard update failed:', error);
        if (liveStatus) {
          liveStatus.textContent = '⚠️ Data Sync Error';
          liveStatus.className = 'status';
        }
      }
    }

    // Initial load + periodic refresh
    updateDashboard();
    setInterval(updateDashboard, 5000);
  }

});
