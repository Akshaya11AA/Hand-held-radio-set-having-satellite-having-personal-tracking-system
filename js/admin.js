/* ═══════════════════════════════════════════════════════════
   EmergencyLink — Admin Panel (js/admin.js)
   ═══════════════════════════════════════════════════════════ */
const Admin = (() => {

  function render() {
    const page = document.getElementById('page-admin');
    page.innerHTML = `
      <!-- Admin identity -->
      <div class="card" style="background:var(--bg-secondary);">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center;font-size:18px;color:white;font-weight:700;">A</div>
          <div style="flex:1;">
            <div style="font-size:14px;font-weight:600;">Admin Console</div>
            <div style="font-size:11px;color:var(--text-hint);">admin@agency.gov · Session active</div>
          </div>
          <button class="btn btn-sm" onclick="Auth.logout()">Sign out</button>
        </div>
      </div>

      <!-- Register device -->
      <div class="card">
        <div class="card-title">Register new ESP32 device</div>
        <div class="field-row">
          <label class="field-label">Device name</label>
          <input type="text" id="new-name" placeholder="e.g. Field unit Foxtrot" />
        </div>
        <div class="field-row">
          <label class="field-label">MAC address</label>
          <input type="text" id="new-mac" placeholder="AA:BB:CC:DD:EE:FF" />
        </div>
        <div class="field-row">
          <label class="field-label">Role</label>
          <select id="new-role">
            <option>Search unit</option>
            <option>Field unit</option>
            <option>Command unit</option>
            <option>Medical unit</option>
            <option>Relay station</option>
          </select>
        </div>
        <div class="field-row">
          <label class="field-label">Firmware version</label>
          <input type="text" id="new-fw" placeholder="v3.2.2" value="v3.2.2" />
        </div>
        <button class="btn btn-primary btn-full" onclick="Admin.addDevice()">+ Register device</button>
      </div>

      <!-- Device management -->
      <div class="card">
        <div class="card-header">
          <div class="card-title" style="margin:0;">Managed devices</div>
          <span style="font-size:11px;color:var(--text-hint);" id="device-count"></span>
        </div>
        <div id="admin-device-list"></div>
      </div>

      <!-- Alert log -->
      <div class="card">
        <div class="card-title">Full alert log</div>
        <div class="scroll-y" style="max-height:220px;" id="admin-alert-log"></div>
      </div>

      <!-- System settings -->
      <div class="card">
        <div class="card-title">System settings</div>
        <div class="setting-row">
          <div><div class="setting-title">Push notifications</div><div class="setting-sub">Browser alerts for emergencies</div></div>
          <label class="toggle"><input type="checkbox" checked onchange="Admin.requestNotif(this)"><span class="toggle-slider"></span></label>
        </div>
        <div class="setting-row">
          <div><div class="setting-title">MQTT broker</div><div class="setting-sub">mqtt://broker.emqx.io:1883</div></div>
          <span class="badge badge-green"><span class="dot dot-green"></span>Connected</span>
        </div>
        <div class="setting-row">
          <div><div class="setting-title">Satellite fallback</div><div class="setting-sub">Iridium SBD · auto-activate</div></div>
          <label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label>
        </div>
        <div class="setting-row">
          <div><div class="setting-title">AI analysis</div><div class="setting-sub">Claude API · real-time inference</div></div>
          <label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label>
        </div>
        <div class="setting-row">
          <div><div class="setting-title">Data logging</div><div class="setting-sub">SQLite local + cloud sync</div></div>
          <label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label>
        </div>
      </div>

      <!-- Thresholds -->
      <div class="card">
        <div class="card-title">Alert thresholds</div>
        <div class="field-row">
          <label class="field-label">No-response timeout (seconds)</label>
          <input type="number" id="thresh-timeout" value="30" min="10" max="120" />
        </div>
        <div class="field-row">
          <label class="field-label">Fall detection sensitivity</label>
          <select id="thresh-fall">
            <option>High (1.5G)</option>
            <option selected>Medium (2.0G)</option>
            <option>Low (2.5G)</option>
          </select>
        </div>
        <div class="field-row">
          <label class="field-label">Battery warning threshold (%)</label>
          <input type="number" id="thresh-bat" value="25" min="5" max="50" />
        </div>
        <button class="btn btn-primary" onclick="Admin.saveThresholds()">Save thresholds</button>
      </div>`;

    renderDeviceList();
    renderAlertLog();
  }

  function renderDeviceList() {
    const devices = AppData.getDevices();
    const el = document.getElementById('admin-device-list');
    const cnt = document.getElementById('device-count');
    if (cnt) cnt.textContent = `${devices.length} registered`;
    if (!el) return;
    el.innerHTML = devices.map(d => `
      <div class="device-row" id="admin-dev-${d.id}">
        <div class="device-avatar" style="background:${d.color}22;color:${d.color};">${d.id}</div>
        <div class="device-info">
          <div class="device-name">${d.name}</div>
          <div class="device-mac">${d.mac}</div>
          <div class="device-meta">${d.role} · ${d.firmware} · 🔋${d.bat}%</div>
        </div>
        <div class="device-actions">
          ${UI.badgeHTML(d.status)}
          <div class="icon-btn" title="Remove device" onclick="Admin.removeDevice('${d.id}')">🗑</div>
        </div>
      </div>`).join('');
  }

  function renderAlertLog() {
    const el = document.getElementById('admin-alert-log');
    if (!el) return;
    el.innerHTML = AppData.getAlertsLog().map(a => {
      const col = UI.sevColor(a.severity);
      return `<div style="display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:0.5px solid var(--border);">
        <div style="width:6px;height:6px;border-radius:50%;background:${col};flex-shrink:0;margin-top:4px;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:11px;font-weight:600;">${a.dev} · ${a.time} ${a.resolved ? '<span style="color:var(--green);font-weight:400;">✓ Resolved</span>' : ''}</div>
          <div style="font-size:10px;color:var(--text-secondary);">${a.msg}</div>
        </div>
      </div>`;
    }).join('');
  }

  function addDevice() {
    const name = document.getElementById('new-name').value.trim();
    const mac  = document.getElementById('new-mac').value.trim().toUpperCase();
    const role = document.getElementById('new-role').value;
    const fw   = document.getElementById('new-fw').value.trim() || 'v3.2.2';
    if (!name) { alert('Please enter a device name.'); return; }
    const macRe = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/;
    if (!macRe.test(mac)) { alert('Invalid MAC address.\nFormat: AA:BB:CC:DD:EE:FF'); return; }
    if (AppData.getDevices().some(d => d.mac === mac)) { alert('A device with this MAC address is already registered.'); return; }
    const id = AppData.addDevice({ name, mac, role, firmware: fw });
    document.getElementById('new-name').value = '';
    document.getElementById('new-mac').value = '';
    renderDeviceList();
    UI.triggerAlert(`Device ${id} (${name}) registered — MAC ${mac}`);
  }

  function removeDevice(id) {
    if (!confirm(`Remove device ${id}?\nThis will also remove all associated data.`)) return;
    AppData.removeDevice(id);
    renderDeviceList();
  }

  function saveThresholds() {
    AppData.setThresholds({
      noResponseSec: parseInt(document.getElementById('thresh-timeout').value),
      fallSensitivity: document.getElementById('thresh-fall').value,
      batteryWarnPct: parseInt(document.getElementById('thresh-bat').value),
    });
    alert('Thresholds saved and applied to all devices.');
  }

  function requestNotif(cb) {
    if (cb.checked && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  return { render, addDevice, removeDevice, saveThresholds, requestNotif };
})();
