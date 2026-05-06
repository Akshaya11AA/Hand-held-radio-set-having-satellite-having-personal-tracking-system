/* ═══════════════════════════════════════════════════════════
   EmergencyLink — Auth (js/auth.js)
   ═══════════════════════════════════════════════════════════ */
const Auth = (() => {
  function login() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (!user || !pass) { alert('Please enter credentials.'); return; }
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    App.init();
  }
  function logout() {
    if (!confirm('Sign out?')) return;
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
  }
  return { login, logout };
})();
