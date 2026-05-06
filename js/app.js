/* ═══════════════════════════════════════════════════════════
   EmergencyLink — App Bootstrap (js/app.js)
   ═══════════════════════════════════════════════════════════ */
const App = (() => {

  let _sensorTick = null;

  function init() {
    // Request notification permission
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Start clock
    UI.startClock();

    // Render default page
    Dashboard.render();

    // Simulate live sensor ticking
    _sensorTick = setInterval(() => {
      AppData.tickSensors();
    }, 2500);

    // Simulate an incoming emergency alert after 3s
    setTimeout(() => {
      UI.triggerAlert('⚠ Emergency: D-002 fall detected — no user response in 42 seconds!');
    }, 3000);

    // Simulate MQTT keepalive pulse
    setInterval(() => {
      const el = document.getElementById('mqtt-status');
      if (!el) return;
      el.style.opacity = '.5';
      setTimeout(() => { el.style.opacity = '1'; }, 300);
    }, 5000);

    console.log('EmergencyLink initialized — all modules loaded.');
    console.log('Devices:', AppData.getDevices().map(d => `${d.id}@${d.mac}`).join(', '));
  }

  return { init };
})();

// ── Login on Enter key ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ['login-user','login-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') Auth.login(); });
  });
});
