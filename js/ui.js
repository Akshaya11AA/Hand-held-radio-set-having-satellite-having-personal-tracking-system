/* ═══════════════════════════════════════════════════════════
   EmergencyLink — UI Controller (js/ui.js)
   ═══════════════════════════════════════════════════════════ */
const UI = (() => {

  const PAGES = ['dashboard','tracking','alerts','sensors','voice','ai','analytics','admin'];
  let _currentPage = 'dashboard';

  function goto(page) {
    if (!PAGES.includes(page)) return;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    _currentPage = page;

    // Lazy render
    switch (page) {
      case 'dashboard':  Dashboard.render();   break;
      case 'tracking':   MapModule.render();   break;
      case 'alerts':     AlertsPage.render();  break;
      case 'sensors':    Sensors.render();     break;
      case 'voice':      Voice.render();       break;
      case 'ai':         AIPage.render();      break;
      case 'analytics':  Analytics.render();   break;
      case 'admin':      Admin.render();       break;
    }
  }

  function triggerAlert(msg) {
    const bar = document.getElementById('alert-bar');
    document.getElementById('alert-text').textContent = msg;
    bar.classList.add('show');
    setTimeout(() => bar.classList.remove('show'), 7000);
    // Try browser notification
    if (Notification.permission === 'granted') {
      new Notification('⚠ EmergencyLink', { body: msg, icon: '' });
    }
  }

  function dismissAlert() {
    document.getElementById('alert-bar').classList.remove('show');
  }

  // Status helpers
  const STATUS_CFG = {
    active:    { cls: 'badge-green',  dot: 'dot-green', lbl: 'Active'    },
    emergency: { cls: 'badge-red',    dot: 'dot-red',   lbl: 'Emergency' },
    inactive:  { cls: 'badge-gray',   dot: 'dot-gray',  lbl: 'Inactive'  },
    warning:   { cls: 'badge-amber',  dot: 'dot-amber', lbl: 'Warning'   },
  };
  const SEV_COLOR = { red: 'var(--red)', amber: 'var(--amber)', green: 'var(--green)', blue: 'var(--blue)' };

  function badgeHTML(status) {
    const s = STATUS_CFG[status] || STATUS_CFG.inactive;
    return `<span class="badge ${s.cls}"><span class="dot ${s.dot}"></span>${s.lbl}</span>`;
  }

  function sevColor(sev) { return SEV_COLOR[sev] || 'var(--gray)'; }

  // Clock
  function startClock() {
    const el = document.getElementById('clock');
    const tick = () => { el.textContent = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' }); };
    tick(); setInterval(tick, 1000);
  }

  return { goto, triggerAlert, dismissAlert, badgeHTML, sevColor, startClock, currentPage: () => _currentPage };
})();
