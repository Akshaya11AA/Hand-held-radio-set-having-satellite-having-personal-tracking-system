/* ═══════════════════════════════════════════════════════════
   EmergencyLink — Data Store (js/data.js)
   Simulates real-time ESP32 device data. In production,
   replace with MQTT / WebSocket / Firebase listeners.
   ═══════════════════════════════════════════════════════════ */

const AppData = (() => {

  // ── Devices ────────────────────────────────────────────────
  const devices = [
    {
      id: 'D-001', name: 'Search unit Alpha',
      mac: 'A4:CF:12:8E:3B:01', role: 'Search unit',
      status: 'active', bat: 87, signal: -62,
      lat: 13.0827, lng: 80.2707, color: '#1D9E75',
      firmware: 'v3.2.1', uptime: '14h 22m',
    },
    {
      id: 'D-002', name: 'Field unit Bravo',
      mac: 'A4:CF:12:8E:3B:02', role: 'Field unit',
      status: 'emergency', bat: 52, signal: -75,
      lat: 13.0612, lng: 80.2488, color: '#E24B4A',
      firmware: 'v3.2.1', uptime: '8h 05m',
    },
    {
      id: 'D-003', name: 'Command unit',
      mac: 'A4:CF:12:8E:3B:03', role: 'Command',
      status: 'active', bat: 94, signal: -58,
      lat: 13.0901, lng: 80.2891, color: '#185FA5',
      firmware: 'v3.2.2', uptime: '22h 10m',
    },
    {
      id: 'D-004', name: 'Medical unit Delta',
      mac: 'A4:CF:12:8E:3B:04', role: 'Medical unit',
      status: 'inactive', bat: 21, signal: -89,
      lat: 13.0710, lng: 80.2623, color: '#888780',
      firmware: 'v3.1.8', uptime: '0h 00m',
    },
    {
      id: 'D-005', name: 'Field unit Echo',
      mac: 'A4:CF:12:8E:3B:05', role: 'Field unit',
      status: 'active', bat: 73, signal: -68,
      lat: 13.0855, lng: 80.2750, color: '#534AB7',
      firmware: 'v3.2.1', uptime: '6h 41m',
    },
  ];

  // ── Alert Log ───────────────────────────────────────────────
  const alertsLog = [
    { id: 1, time: '14:32', dev: 'D-002', type: 'fall',       severity: 'red',   msg: 'Fall detected — no user response (42s)', resolved: false },
    { id: 2, time: '13:55', dev: 'D-004', type: 'battery',    severity: 'amber', msg: 'Low battery — 21% remaining',             resolved: false },
    { id: 3, time: '13:20', dev: 'D-001', type: 'sos',        severity: 'red',   msg: 'SOS button pressed manually',             resolved: true  },
    { id: 4, time: '12:44', dev: 'D-003', type: 'checkin',    severity: 'green', msg: 'Device check-in OK',                      resolved: true  },
    { id: 5, time: '11:58', dev: 'D-002', type: 'signal',     severity: 'amber', msg: 'Signal degraded (−75 dBm)',               resolved: true  },
    { id: 6, time: '11:30', dev: 'D-005', type: 'join',       severity: 'green', msg: 'Joined network — MAC verified',           resolved: true  },
    { id: 7, time: '10:15', dev: 'D-002', type: 'vibration',  severity: 'red',   msg: 'Vibration spike — possible fall',         resolved: true  },
  ];

  // ── Sensor Data (per device index) ─────────────────────────
  const sensorProfiles = [
    // D-001 — normal
    { accel: 0.3, gyro: 12,  temp: 36.8, humidity: 62, bat: 87, rssi: 62 },
    // D-002 — emergency (fall)
    { accel: 2.8, gyro: 180, temp: 37.4, humidity: 68, bat: 52, rssi: 25 },
    // D-003 — normal command
    { accel: 0.1, gyro: 5,   temp: 36.5, humidity: 58, bat: 94, rssi: 72 },
    // D-004 — inactive, low bat
    { accel: 0.0, gyro: 0,   temp: 35.1, humidity: 55, bat: 21, rssi: 11 },
    // D-005 — normal
    { accel: 0.5, gyro: 22,  temp: 37.0, humidity: 65, bat: 73, rssi: 48 },
  ];

  // ── Activity Logs ───────────────────────────────────────────
  const activityLogs = [
    ['14:38 — Accelerometer nominal (0.3G)', '14:35 — GPS fix acquired', '14:30 — Heartbeat OK', '14:25 — Signal check −62 dBm', '14:10 — MQTT keepalive sent'],
    ['14:38 — ⚠ FALL DETECTED (2.8G spike)', '14:37 — Gyroscope anomaly 180°/s', '14:36 — SOS auto-triggered', '14:30 — Battery warning 52%', '14:20 — Signal drop −75 dBm'],
    ['14:38 — All systems nominal', '14:32 — GPS position update', '14:28 — MQTT keepalive sent', '14:20 — Battery charged: 94%', '14:00 — Network broadcast sent'],
    ['13:10 — Device shutdown (low bat)', '12:55 — Battery critical 23%', '12:30 — Last GPS fix', '12:00 — MQTT disconnect'],
    ['14:38 — Status nominal', '14:30 — GPS update', '14:22 — Heartbeat sent', '14:15 — Signal check −68 dBm'],
  ];

  // ── Voice Log ───────────────────────────────────────────────
  const voiceLog = [
    { time: '14:35', dev: 'D-001', dir: 'in',  dur: '0:12', note: 'Inbound voice alert — fall site report' },
    { time: '14:20', dev: 'D-003', dir: 'out', dur: '0:08', note: 'Outbound command broadcast' },
    { time: '13:10', dev: 'D-002', dir: 'in',  dur: '0:31', note: 'Distress call received — garbled audio' },
    { time: '12:00', dev: 'D-005', dir: 'in',  dur: '0:05', note: 'Status check-in' },
    { time: '11:40', dev: 'D-003', dir: 'out', dur: '0:15', note: 'Team briefing broadcast' },
  ];

  // ── AI Insights ─────────────────────────────────────────────
  const aiInsights = [
    { icon: '📉', sev: 'red',   title: 'Abnormal fall pattern — D-002', body: 'D-002 triggered 3 fall events this shift (avg 0.2/shift). Immediate physical check recommended.' },
    { icon: '🔋', sev: 'amber', title: 'Battery failure risk — D-004',  body: 'At current discharge rate D-004 reaches 0% in ~1.4 hours. Return to base or swap battery.' },
    { icon: '📡', sev: 'amber', title: 'Signal degradation — D-002',    body: 'RSSI dropped 12 dBm in 30 min. Device may be entering dead zone. Consider relay placement.' },
    { icon: '✅', sev: 'green', title: 'D-003 operating normally',       body: 'All vitals within safe range. 94% battery, strong signal. No anomalies in last 6 hours.' },
  ];

  // ── Risk Predictions ────────────────────────────────────────
  const riskPredictions = [
    { dev: 'D-002', risk: 91, label: 'Critical — likely fallen user, no response' },
    { dev: 'D-004', risk: 55, label: 'Moderate — battery failure imminent' },
    { dev: 'D-001', risk: 12, label: 'Low — minor signal variation' },
    { dev: 'D-005', risk: 8,  label: 'Low — all sensors within range' },
  ];

  // ── Analytics ───────────────────────────────────────────────
  const analytics = {
    trends:     { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], data: [1,0,2,1,3,0,2] },
    alertTypes: { labels: ['Fall detected','No response','Manual SOS'], data: [40,35,25] },
    battery: {
      labels: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00'],
      d001:   [100,98,95,92,90,88,87,87],
      d002:   [100,90,82,75,68,62,58,52],
      d003:   [100,99,98,97,96,95,95,94],
    },
  };

  // ── Thresholds ──────────────────────────────────────────────
  let thresholds = {
    noResponseSec: 30,
    fallSensitivity: 'Medium (2.0G)',
    batteryWarnPct: 25,
  };

  // ── Public API ──────────────────────────────────────────────
  return {
    getDevices:      () => [...devices],
    getDevice:       (id) => devices.find(d => d.id === id),
    getAlertsLog:    () => [...alertsLog],
    getActiveAlerts: () => alertsLog.filter(a => a.severity === 'red' && !a.resolved),
    getSensorProfile:(idx) => ({ ...sensorProfiles[idx] }),
    getActivityLog:  (idx) => [...activityLogs[idx]],
    getVoiceLog:     () => [...voiceLog],
    getAIInsights:   () => [...aiInsights],
    getRiskPredictions: () => [...riskPredictions],
    getAnalytics:    () => analytics,
    getThresholds:   () => ({ ...thresholds }),
    setThresholds:   (t) => { thresholds = { ...thresholds, ...t }; },

    addDevice(dev) {
      const next = `D-${String(devices.length + 1).padStart(3, '0')}`;
      devices.push({ id: next, status: 'inactive', bat: 100, signal: -70, lat: 13.07 + Math.random() * 0.02, lng: 80.25 + Math.random() * 0.04, color: '#534AB7', firmware: 'v3.2.2', uptime: '0h 00m', ...dev, id: next });
      return next;
    },

    removeDevice(id) {
      const idx = devices.findIndex(d => d.id === id);
      if (idx !== -1) devices.splice(idx, 1);
    },

    resolveAlert(id) {
      const a = alertsLog.find(a => a.id === id);
      if (a) a.resolved = true;
    },

    // Simulate live sensor fluctuation
    tickSensors() {
      sensorProfiles.forEach((s, i) => {
        if (devices[i].status === 'inactive') return;
        s.accel    = +(s.accel * 0.95 + Math.random() * 0.1).toFixed(2);
        s.gyro     = Math.round(s.gyro * 0.9 + Math.random() * 5);
        s.temp     = +(s.temp + (Math.random() - 0.5) * 0.1).toFixed(1);
        s.rssi     = Math.min(100, Math.max(0, s.rssi + Math.round((Math.random() - 0.5) * 3)));
        devices[i].signal = -40 - Math.round((100 - s.rssi) * 0.6);
      });
    },
  };
})();
