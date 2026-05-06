/* ═══════════════════════════════════════════════════════════
   EmergencyLink — Live Map Module (js/map.js)
   Uses Leaflet.js with OpenStreetMap tiles for real GPS map
   ═══════════════════════════════════════════════════════════ */
const MapModule = (() => {

  let _map = null;
  let _markers = {};
  let _circles = {};
  let _trails = {};
  let _initialized = false;
  let _liveInterval = null;
  let _showTrails = true;

  // ── Render page shell ─────────────────────────────────────
  function render() {
    const page = document.getElementById('page-tracking');
    page.innerHTML = `
      <div class="card" style="padding:0;overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:0.5px solid var(--border);">
          <div class="card-title" style="margin:0;">Live GPS map</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span id="gps-time" style="font-size:10px;color:var(--text-hint);"></span>
            <button class="btn btn-sm" onclick="MapModule.toggleTrails()" id="trail-btn">Trails ON</button>
            <button class="btn btn-sm" onclick="MapModule.centerAll()">⊕ Fit all</button>
          </div>
        </div>
        <div id="leaflet-map" style="width:100%;height:340px;z-index:1;"></div>
      </div>

      <div class="card">
        <div class="card-title">Map legend</div>
        <div style="display:flex;flex-wrap:wrap;gap:14px;">
          <span style="display:flex;align-items:center;gap:6px;font-size:11px;"><span style="width:12px;height:12px;border-radius:50%;background:#1D9E75;display:inline-block;"></span>Active</span>
          <span style="display:flex;align-items:center;gap:6px;font-size:11px;"><span style="width:12px;height:12px;border-radius:50%;background:#E24B4A;display:inline-block;"></span>Emergency</span>
          <span style="display:flex;align-items:center;gap:6px;font-size:11px;"><span style="width:12px;height:12px;border-radius:50%;background:#888780;display:inline-block;"></span>Inactive</span>
          <span style="display:flex;align-items:center;gap:6px;font-size:11px;"><span style="width:30px;height:3px;background:#185FA5;display:inline-block;border-radius:2px;opacity:.6;"></span>GPS trail</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Device positions — click row to focus</div>
        <div id="tracking-devices"></div>
      </div>

      <div class="card">
        <div class="card-title">Location history — last 1 hr</div>
        <div class="timeline" id="loc-history"></div>
      </div>`;

    loadLeafletThenInit();
    renderDeviceList();
    renderHistory();
    updateTimestamp();
  }

  // ── Load Leaflet dynamically ──────────────────────────────
  function loadLeafletThenInit() {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (typeof L !== 'undefined') {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      script.onerror = () => {
        const el = document.getElementById('leaflet-map');
        if (el) el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-size:12px;">Map requires internet connection</div>';
      };
      document.head.appendChild(script);
    }
  }

  // ── Initialize Leaflet map ────────────────────────────────
  function initMap() {
    // Destroy old instance if re-navigating
    if (_map) {
      clearInterval(_liveInterval);
      _map.remove();
      _map = null;
      _markers = {};
      _circles = {};
      _trails = {};
    }

    _map = L.map('leaflet-map', {
      center: [13.0827, 80.2707],
      zoom: 14,
      zoomControl: true,
    });

    // Real OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(_map);

    // Place all device markers
    AppData.getDevices().forEach(d => addMarker(d));

    // Fit bounds
    centerAll();

    // Start live updates
    startLive();

    _initialized = true;
  }

  // ── Build custom pin icon ─────────────────────────────────
  function makeIcon(d) {
    const pulseStyle = d.status === 'emergency'
      ? `position:absolute;inset:-6px;border-radius:50%;border:2px solid ${d.color};animation:emergencyPulse 1.1s ease-out infinite;`
      : 'display:none;';

    const html = `
      <div style="position:relative;width:36px;height:44px;">
        <div style="${pulseStyle}"></div>
        <div style="
          position:absolute;bottom:0;left:0;
          width:36px;height:36px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:${d.color};
          border:3px solid white;
          box-shadow:0 3px 10px rgba(0,0,0,0.4);
        "></div>
        <div style="
          position:absolute;bottom:4px;left:0;width:36px;
          display:flex;align-items:center;justify-content:center;
          font-size:8px;font-weight:800;color:white;letter-spacing:-0.5px;
          font-family:-apple-system,sans-serif;
        ">${d.id}</div>
      </div>`;

    return L.divIcon({
      html,
      className: '',
      iconSize: [36, 44],
      iconAnchor: [18, 44],
      popupAnchor: [0, -46],
    });
  }

  // ── Popup content ─────────────────────────────────────────
  function popupHTML(d) {
    const sc = d.status === 'emergency' ? '#E24B4A' : d.status === 'active' ? '#1D9E75' : '#888780';
    return `
      <div style="font-family:-apple-system,sans-serif;min-width:190px;font-size:12px;">
        <div style="font-weight:700;font-size:14px;margin-bottom:3px;">${d.name}</div>
        <div style="font-size:10px;color:#888;font-family:monospace;margin-bottom:10px;">${d.mac}</div>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#888;padding:3px 0;">Status</td><td style="font-weight:700;color:${sc};text-transform:capitalize;">${d.status}</td></tr>
          <tr><td style="color:#888;padding:3px 0;">Battery</td><td style="font-weight:600;">${d.bat}%</td></tr>
          <tr><td style="color:#888;padding:3px 0;">Signal</td><td style="font-weight:600;">${d.signal} dBm</td></tr>
          <tr><td style="color:#888;padding:3px 0;">Latitude</td><td style="font-weight:600;">${d.lat.toFixed(6)}°N</td></tr>
          <tr><td style="color:#888;padding:3px 0;">Longitude</td><td style="font-weight:600;">${d.lng.toFixed(6)}°E</td></tr>
          <tr><td style="color:#888;padding:3px 0;">Firmware</td><td style="font-weight:600;">${d.firmware}</td></tr>
          <tr><td style="color:#888;padding:3px 0;">Uptime</td><td style="font-weight:600;">${d.uptime}</td></tr>
        </table>
        ${d.status === 'emergency' ? `
          <div style="margin-top:10px;padding:7px 10px;background:#FCEBEB;border-radius:6px;color:#501313;font-weight:700;font-size:11px;">
            ⚠ Emergency — fall detected, no response
          </div>` : ''}
      </div>`;
  }

  // ── Add marker + circle + trail for a device ──────────────
  function addMarker(d) {
    const latlng = [d.lat, d.lng];

    const marker = L.marker(latlng, { icon: makeIcon(d) })
      .addTo(_map)
      .bindPopup(popupHTML(d), { maxWidth: 260, minWidth: 200 });

    _markers[d.id] = marker;

    _circles[d.id] = L.circle(latlng, {
      radius: 25,
      color: d.color,
      fillColor: d.color,
      fillOpacity: 0.12,
      weight: 1,
    }).addTo(_map);

    _trails[d.id] = L.polyline([latlng], {
      color: d.color,
      weight: 3,
      opacity: 0.55,
    }).addTo(_map);
  }

  // ── Update existing marker position ───────────────────────
  function updateMarker(d) {
    if (!_map) return;
    const latlng = [d.lat, d.lng];

    if (!_markers[d.id]) { addMarker(d); return; }

    _markers[d.id].setLatLng(latlng);
    _markers[d.id].setIcon(makeIcon(d));
    _markers[d.id].setPopupContent(popupHTML(d));

    if (_circles[d.id]) _circles[d.id].setLatLng(latlng);

    if (_trails[d.id] && _showTrails) {
      const pts = _trails[d.id].getLatLngs();
      pts.push(L.latLng(latlng));
      if (pts.length > 40) pts.shift();
      _trails[d.id].setLatLngs(pts);
    }
  }

  // ── Fit map to show all devices ───────────────────────────
  function centerAll() {
    if (!_map) return;
    const latlngs = AppData.getDevices().map(d => [d.lat, d.lng]);
    if (latlngs.length > 0) {
      _map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50], maxZoom: 15 });
    }
  }

  // ── Toggle trail lines on/off ─────────────────────────────
  function toggleTrails() {
    _showTrails = !_showTrails;
    const btn = document.getElementById('trail-btn');
    if (btn) btn.textContent = `Trails ${_showTrails ? 'ON' : 'OFF'}`;
    Object.values(_trails).forEach(t => {
      _showTrails ? t.addTo(_map) : _map.removeLayer(t);
    });
  }

  // ── Focus map on one device (click from list) ─────────────
  function focusDevice(id) {
    if (!_map || !_markers[id]) return;
    const d = AppData.getDevice(id);
    if (!d) return;
    _map.flyTo([d.lat, d.lng], 17, { animate: true, duration: 1 });
    setTimeout(() => _markers[id].openPopup(), 800);
  }

  // ── Live GPS simulation (replace with MQTT/WebSocket) ─────
  // To connect real ESP32: replace the body of this interval
  // with your MQTT subscribe or WebSocket onmessage handler.
  // Each device should push: { id, lat, lng, bat, signal, status }
  function startLive() {
    if (_liveInterval) clearInterval(_liveInterval);

    _liveInterval = setInterval(() => {
      const devices = AppData.getDevices();
      devices.forEach(d => {
        if (d.status === 'inactive') return;
        // ── REPLACE THIS with real GPS from ESP32 ──
        d.lat += (Math.random() - 0.5) * 0.0004;
        d.lng += (Math.random() - 0.5) * 0.0004;
        // ──────────────────────────────────────────
        updateMarker(d);
      });
      updateTimestamp();
      renderDeviceList();
    }, 3000);
  }

  // ── Device list below the map ─────────────────────────────
  function renderDeviceList() {
    const el = document.getElementById('tracking-devices');
    if (!el) return;
    el.innerHTML = AppData.getDevices().map(d => `
      <div class="device-row" onclick="MapModule.focusDevice('${d.id}')" style="cursor:pointer;" title="Click to focus on map">
        <div style="width:12px;height:12px;border-radius:50%;background:${d.color};flex-shrink:0;${d.status==='emergency'?'animation:pulse-red 1s infinite;':''}"></div>
        <div class="device-info">
          <div class="device-name">${d.name}</div>
          <div class="device-mac">${d.mac}</div>
          <div class="device-meta">${d.lat.toFixed(5)}°N · ${d.lng.toFixed(5)}°E · 🔋${d.bat}%</div>
        </div>
        ${UI.badgeHTML(d.status)}
      </div>`).join('');
  }

  // ── Location history timeline ─────────────────────────────
  function renderHistory() {
    const el = document.getElementById('loc-history');
    if (!el) return;
    const times = ['14:38','14:23','14:09','13:52','13:41','13:28'];
    const devices = AppData.getDevices();
    el.innerHTML = times.map((t, i) => {
      const d = devices[i % devices.length];
      const jlat = (d.lat + (Math.random() - 0.5) * 0.003).toFixed(5);
      const jlng = (d.lng + (Math.random() - 0.5) * 0.003).toFixed(5);
      return `<div class="tl-item" onclick="MapModule.focusDevice('${d.id}')" style="cursor:pointer;">
        <div class="tl-dot" style="background:${d.color};"></div>
        <div class="tl-time">${t} · ${d.name}</div>
        <div class="tl-desc">${jlat}°N, ${jlng}°E</div>
      </div>`;
    }).join('');
  }

  function updateTimestamp() {
    const el = document.getElementById('gps-time');
    if (el) el.textContent = 'Updated ' + new Date().toLocaleTimeString();
  }

  return { render, centerAll, toggleTrails, focusDevice };
})();
