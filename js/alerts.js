/* ═══════════════════════════════════════════════════════════
   EmergencyLink — Alerts Page (js/alerts.js)
   ═══════════════════════════════════════════════════════════ */
const AlertsPage = (() => {

  function render() {
    const page = document.getElementById('page-alerts');
    page.innerHTML = `
      <!-- Active emergencies -->
      <div class="card" style="border-color:var(--red);">
        <div class="card-title" style="color:var(--red);">Active emergencies</div>
        <div id="active-alerts-list"></div>
      </div>

      <!-- All log -->
      <div class="card">
        <div class="card-title">Alert log</div>
        <div class="scroll-y" style="max-height:280px;" id="alerts-log-list"></div>
      </div>

      <!-- Thresholds -->
      <div class="card">
        <div class="card-title">Alert thresholds</div>
        <div class="field-row">
          <label class="field-label">No-response timeout (seconds)</label>
          <input type="number" id="thresh-timeout-a" value="${AppData.getThresholds().noResponseSec}" min="10" max="120" />
        </div>
        <div class="field-row">
          <label class="field-label">Fall sensitivity</label>
          <select id="thresh-fall-a">
            <option ${AppData.getThresholds().fallSensitivity==='High (1.5G)'?'selected':''}>High (1.5G)</option>
            <option ${AppData.getThresholds().fallSensitivity==='Medium (2.0G)'?'selected':''}>Medium (2.0G)</option>
            <option ${AppData.getThresholds().fallSensitivity==='Low (2.5G)'?'selected':''}>Low (2.5G)</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="AlertsPage.saveThresh()">Save thresholds</button>
      </div>`;

    renderActive();
    renderLog();
  }

  function renderActive() {
    const el = document.getElementById('active-alerts-list');
    if (!el) return;
    const active = AppData.getActiveAlerts();
    if (!active.length) {
      el.innerHTML = '<div class="empty-state"><span class="empty-icon">✅</span>No active emergencies</div>';
      return;
    }
    el.innerHTML = active.map(a => `
      <div id="alert-item-${a.id}" style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:0.5px solid var(--red-bg);">
        <span style="font-size:20px;">🚨</span>
        <div style="flex:1;">
          <div style="font-size:12px;font-weight:600;color:var(--red-text);">${a.dev} · ${a.time}</div>
          <div style="font-size:11px;color:var(--red-text);opacity:.85;margin-top:3px;">${a.msg}</div>
        </div>
        <button class="btn btn-sm btn-success" onclick="AlertsPage.resolve(${a.id})">✓ Resolve</button>
      </div>`).join('');
  }

  function renderLog() {
    const el = document.getElementById('alerts-log-list');
    if (!el) return;
    el.innerHTML = AppData.getAlertsLog().map(a => {
      const col = UI.sevColor(a.severity);
      return `<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--border);">
        <div style="width:7px;height:7px;border-radius:50%;background:${col};flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:11px;font-weight:600;">${a.dev} · ${a.time} ${a.resolved?'<span style="color:var(--green);font-weight:400;">✓</span>':''}</div>
          <div style="font-size:10px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.msg}</div>
        </div>
        <span class="badge ${a.severity==='red'?'badge-red':a.severity==='amber'?'badge-amber':'badge-green'}" style="flex-shrink:0;">${a.type}</span>
      </div>`;
    }).join('');
  }

  function resolve(id) {
    AppData.resolveAlert(id);
    const item = document.getElementById('alert-item-' + id);
    if (item) { item.style.opacity = '.4'; item.style.pointerEvents = 'none'; }
    // Update nav badge
    const badge = document.getElementById('alert-count');
    if (badge) {
      const n = parseInt(badge.textContent) - 1;
      badge.textContent = n;
      if (n <= 0) badge.style.display = 'none';
    }
  }

  function saveThresh() {
    AppData.setThresholds({
      noResponseSec: parseInt(document.getElementById('thresh-timeout-a').value),
      fallSensitivity: document.getElementById('thresh-fall-a').value,
    });
    alert('Thresholds saved.');
  }

  return { render, resolve, saveThresh };
})();
