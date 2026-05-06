/* ═══════════════════════════════════════════════════════════
   EmergencyLink — Sensors Page (js/sensors.js)
   ═══════════════════════════════════════════════════════════ */
const Sensors = (() => {
  let _deviceIdx = 0;
  let _liveInterval = null;

  function render() {
    const page = document.getElementById('page-sensors');
    const devices = AppData.getDevices();
    page.innerHTML = `
      <div class="card">
        <div class="card-title">Select device</div>
        <select id="sensor-device-sel" onchange="Sensors.switchDevice(this.value)">
          ${devices.map((d,i) => `<option value="${i}">${d.id} — ${d.name}</option>`).join('')}
        </select>
      </div>
      <div class="card" id="sensor-status-card">
        <div class="card-header">
          <div class="card-title" style="margin:0;">Live sensor data</div>
          <span id="sensor-badge" class="badge badge-green"><span class="dot dot-green"></span>Safe</span>
        </div>
        <div id="sensor-bars"></div>
      </div>
      <div class="card">
        <div class="card-title">Device info</div>
        <div id="device-info-table"></div>
      </div>
      <div class="card">
        <div class="card-title">Activity log</div>
        <div class="scroll-y" style="max-height:200px;" id="activity-log"></div>
      </div>
      <div class="card">
        <div class="card-title">Detection settings</div>
        <div class="setting-row">
          <div><div class="setting-title">Auto-alert on fall</div><div class="setting-sub">Trigger emergency if accel > 2G</div></div>
          <label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label>
        </div>
        <div class="setting-row">
          <div><div class="setting-title">Vibration monitoring</div><div class="setting-sub">Continuous MPU-6050 polling</div></div>
          <label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label>
        </div>
        <div class="setting-row">
          <div><div class="setting-title">Temperature alerts</div><div class="setting-sub">Alert if body temp > 38.5°C</div></div>
          <label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label>
        </div>
      </div>`;

    switchDevice(0);
    startLive();
  }

  function switchDevice(idx) {
    _deviceIdx = parseInt(idx);
    renderBars();
    renderDeviceInfo();
    renderActivityLog();
  }

  function renderBars() {
    const s = AppData.getSensorProfile(_deviceIdx);
    const dev = AppData.getDevices()[_deviceIdx];
    const isEmerg = dev.status === 'emergency';

    const sb = document.getElementById('sensor-badge');
    if (sb) {
      sb.className = 'badge ' + (isEmerg ? 'badge-red' : dev.bat < 25 ? 'badge-amber' : 'badge-green');
      sb.innerHTML = `<span class="dot ${isEmerg ? 'dot-red' : dev.bat < 25 ? 'dot-amber' : 'dot-green'}"></span>${isEmerg ? 'Emergency' : dev.bat < 25 ? 'Warning' : 'Safe'}`;
    }

    const bars = [
      { label: 'Accelerometer', val: s.accel, max: 4,   unit: 'G',   color: s.accel > 2 ? 'var(--red)' : 'var(--green)' },
      { label: 'Gyroscope',     val: s.gyro,  max: 360, unit: '°/s', color: s.gyro > 100 ? 'var(--red)' : 'var(--blue)' },
      { label: 'Temperature',   val: s.temp,  max: 42,  unit: '°C',  color: s.temp > 38 ? 'var(--amber)' : 'var(--blue)' },
      { label: 'Humidity',      val: s.humidity, max: 100, unit: '%', color: 'var(--purple)' },
      { label: 'Battery',       val: s.bat,   max: 100, unit: '%',   color: s.bat < 25 ? 'var(--red)' : s.bat < 50 ? 'var(--amber)' : 'var(--green)' },
      { label: 'Signal RSSI',   val: s.rssi,  max: 100, unit: '%',   color: s.rssi < 30 ? 'var(--red)' : s.rssi < 50 ? 'var(--amber)' : 'var(--green)' },
    ];

    const el = document.getElementById('sensor-bars');
    if (!el) return;
    el.innerHTML = bars.map(b => {
      const pct = Math.min(100, Math.round((b.val / b.max) * 100));
      const disp = b.val < 10 ? b.val.toFixed(1) : Math.round(b.val);
      return `<div class="sensor-row">
        <div class="sensor-label">${b.label}</div>
        <div class="sensor-bar-wrap"><div class="sensor-bar" style="width:${pct}%;background:${b.color};"></div></div>
        <div class="sensor-val" style="color:${b.color};">${disp}${b.unit}</div>
      </div>`;
    }).join('');
  }

  function renderDeviceInfo() {
    const d = AppData.getDevices()[_deviceIdx];
    const el = document.getElementById('device-info-table');
    if (!el) return;
    el.innerHTML = [
      { k: 'Device ID', v: d.id },
      { k: 'MAC address', v: d.mac },
      { k: 'Firmware', v: d.firmware },
      { k: 'Uptime', v: d.uptime },
      { k: 'Role', v: d.role },
      { k: 'GPS', v: `${d.lat.toFixed(4)}°N, ${d.lng.toFixed(4)}°E` },
    ].map(r => `<div class="info-row"><span class="info-key">${r.k}</span><span class="info-val">${r.v}</span></div>`).join('');
  }

  function renderActivityLog() {
    const el = document.getElementById('activity-log');
    if (!el) return;
    const logs = AppData.getActivityLog(_deviceIdx);
    el.innerHTML = logs.map(l => {
      const isWarn = l.includes('⚠') || l.includes('FALL') || l.includes('SOS') || l.includes('critical');
      return `<div style="font-size:11px;padding:6px 0;border-bottom:0.5px solid var(--border);color:${isWarn?'var(--red)':'var(--text-primary)'};">${l}</div>`;
    }).join('');
  }

  function startLive() {
    if (_liveInterval) clearInterval(_liveInterval);
    _liveInterval = setInterval(() => {
      AppData.tickSensors();
      if (document.getElementById('sensor-bars')) renderBars();
    }, 2000);
  }

  return { render, switchDevice };
})();
