/* ═══════════════════════════════════════════════════════════
   EmergencyLink — Dashboard (js/dashboard.js)
   ═══════════════════════════════════════════════════════════ */
const Dashboard = (() => {

  function render() {
    const devices = AppData.getDevices();
    const active   = devices.filter(d => d.status === 'active').length;
    const emergencies = devices.filter(d => d.status === 'emergency').length;
    const avgSignal = Math.round(devices.reduce((s, d) => s + d.signal, 0) / devices.length);
    const page = document.getElementById('page-dashboard');

    page.innerHTML = `
      <!-- Stats -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Active devices</div>
          <div class="stat-val" style="color:var(--green);">${active}</div>
          <div class="stat-sub">of ${devices.length} total</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Emergencies today</div>
          <div class="stat-val" style="color:var(--red);">2</div>
          <div class="stat-sub">↑ 1 from yesterday</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg signal</div>
          <div class="stat-val">${avgSignal} <span style="font-size:14px;color:var(--text-hint);">dBm</span></div>
          <div class="stat-sub">RSSI strength</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Network uptime</div>
          <div class="stat-val" style="color:var(--green);">99.2<span style="font-size:14px;">%</span></div>
          <div class="stat-sub">last 7 days</div>
        </div>
      </div>

      <!-- Emergency banner if needed -->
      ${emergencies > 0 ? `
      <div style="background:var(--red-bg);border:1px solid var(--red);border-radius:var(--r-lg);padding:14px;display:flex;gap:12px;align-items:center;">
        <span style="font-size:22px;">🚨</span>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:600;color:var(--red-text);">${emergencies} active emergency${emergencies>1?'s':''}</div>
          <div style="font-size:11px;color:var(--red-text);opacity:.8;margin-top:2px;">D-002 — fall detected, no response</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="UI.goto('alerts')">View</button>
      </div>` : ''}

      <!-- Connected devices -->
      <div class="card">
        <div class="card-header">
          <div class="card-title" style="margin:0;">Connected devices</div>
          <button class="btn btn-sm" onclick="UI.goto('admin')">Manage</button>
        </div>
        ${devices.map(d => `
          <div class="device-row">
            <div class="device-avatar" style="background:${d.color}22;color:${d.color};">${d.id}</div>
            <div class="device-info">
              <div class="device-name">${d.name}</div>
              <div class="device-mac">${d.mac}</div>
              <div class="device-meta">${d.lat.toFixed(4)}°N, ${d.lng.toFixed(4)}°E · 🔋${d.bat}%</div>
            </div>
            ${UI.badgeHTML(d.status)}
          </div>`).join('')}
      </div>

      <!-- Recent events -->
      <div class="card">
        <div class="card-header">
          <div class="card-title" style="margin:0;">Recent events</div>
          <button class="btn btn-sm" onclick="UI.goto('alerts')">All alerts</button>
        </div>
        <div class="timeline">
          ${AppData.getAlertsLog().slice(0,5).map(a => `
            <div class="tl-item">
              <div class="tl-dot" style="background:${UI.sevColor(a.severity)};"></div>
              <div class="tl-time">${a.time} · ${a.dev}</div>
              <div class="tl-desc">${a.msg}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Quick actions -->
      <div class="card">
        <div class="card-title">Quick actions</div>
        <div class="btn-row">
          <button class="btn" onclick="UI.triggerAlert('Admin broadcast sent to all devices')">📢 Broadcast</button>
          <button class="btn" onclick="UI.goto('tracking')">📍 Live map</button>
          <button class="btn btn-danger" onclick="UI.triggerAlert('SOS triggered from admin panel')">🆘 SOS</button>
          <button class="btn" onclick="UI.goto('ai')">🤖 AI assist</button>
        </div>
      </div>

      <!-- System status -->
      <div class="card">
        <div class="card-title">System status</div>
        <div class="info-row"><span class="info-key">MQTT broker</span><span class="badge badge-green"><span class="dot dot-green"></span>Connected</span></div>
        <div class="info-row"><span class="info-key">Satellite link</span><span class="badge badge-green"><span class="dot dot-green"></span>Active</span></div>
        <div class="info-row"><span class="info-key">AI engine</span><span class="badge badge-blue">Claude Sonnet 4</span></div>
        <div class="info-row"><span class="info-key">Protocol</span><span class="info-val">LoRa 433MHz · SF9</span></div>
        <div class="info-row"><span class="info-key">Last sync</span><span class="info-val">${new Date().toLocaleTimeString()}</span></div>
      </div>`;
  }

  return { render };
})();
