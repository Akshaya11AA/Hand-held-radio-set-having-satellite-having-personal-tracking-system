/* ═══════════════════════════════════════════════════════════
   EmergencyLink — Analytics (js/analytics.js)
   ═══════════════════════════════════════════════════════════ */
const Analytics = (() => {
  let _built = false;

  function render() {
    if (_built) return;
    _built = true;

    const page = document.getElementById('page-analytics');
    page.innerHTML = `
      <div class="card">
        <div class="card-title">Emergency trends — last 7 days</div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-swatch" style="background:#E24B4A;"></span>Emergencies</span>
        </div>
        <div class="chart-wrap" style="height:180px;"><canvas id="trend-chart" role="img" aria-label="Bar chart of emergency events per day">Mon 1, Tue 0, Wed 2, Thu 1, Fri 3, Sat 0, Sun 2</canvas></div>
      </div>
      <div class="card">
        <div class="card-title">Alert type distribution</div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-swatch" style="background:#E24B4A;"></span>Fall (40%)</span>
          <span class="legend-item"><span class="legend-swatch" style="background:#BA7517;border:1.5px dashed #BA7517;background:transparent;"></span>No response (35%)</span>
          <span class="legend-item"><span class="legend-swatch" style="background:#185FA5;"></span>Manual SOS (25%)</span>
        </div>
        <div class="chart-wrap" style="height:180px;"><canvas id="type-chart" role="img" aria-label="Doughnut chart of alert types">Fall 40%, No-response 35%, SOS 25%</canvas></div>
      </div>
      <div class="card">
        <div class="card-title">Device battery — last 8 hrs</div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-swatch" style="background:#1D9E75;"></span>D-001</span>
          <span class="legend-item"><span class="legend-swatch" style="background:#E24B4A;border:1.5px dashed #E24B4A;background:transparent;"></span>D-002</span>
          <span class="legend-item"><span class="legend-swatch" style="background:#185FA5;"></span>D-003</span>
        </div>
        <div class="chart-wrap" style="height:180px;"><canvas id="perf-chart" role="img" aria-label="Line chart of device battery level over 8 hours">D-001, D-002, D-003 battery levels</canvas></div>
      </div>
      <div class="card">
        <div class="card-title">Location activity heatmap</div>
        <div id="heat-map"><div class="heat-grid"></div><div id="heat-dots"></div><div style="position:absolute;bottom:6px;left:8px;font-size:9px;color:var(--text-hint);">Hotspot density · last 24h</div></div>
      </div>
      <div class="card">
        <div class="card-title">Summary statistics</div>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-label">Total alerts (7d)</div><div class="stat-val" style="color:var(--red);">9</div><div class="stat-sub">↑ 3 vs prev week</div></div>
          <div class="stat-card"><div class="stat-label">Avg response time</div><div class="stat-val">2.4m</div><div class="stat-sub">target &lt; 3 min</div></div>
          <div class="stat-card"><div class="stat-label">Network uptime</div><div class="stat-val" style="color:var(--green);">99.2%</div><div class="stat-sub">all devices</div></div>
          <div class="stat-card"><div class="stat-label">False positives</div><div class="stat-val" style="color:var(--amber);">12%</div><div class="stat-sub">vibration noise</div></div>
        </div>
      </div>`;

    setTimeout(buildCharts, 100);
    buildHeatmap();
  }

  function buildCharts() {
    const a = AppData.getAnalytics();

    new Chart(document.getElementById('trend-chart'), {
      type: 'bar',
      data: {
        labels: a.trends.labels,
        datasets: [{ label: 'Emergencies', data: a.trends.data, backgroundColor: a.trends.data.map(v => v >= 3 ? '#E24B4A' : v >= 2 ? '#BA7517' : v === 0 ? '#1D9E75' : '#BA7517'), borderRadius: 5, borderSkipped: false }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } } }
    });

    new Chart(document.getElementById('type-chart'), {
      type: 'doughnut',
      data: {
        labels: ['Fall detected (40%)', 'No response (35%)', 'Manual SOS (25%)'],
        datasets: [{ data: [40, 35, 25], backgroundColor: ['#E24B4A', '#BA7517', '#185FA5'], borderWidth: 3, borderColor: '#ffffff' }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '62%' }
    });

    new Chart(document.getElementById('perf-chart'), {
      type: 'line',
      data: {
        labels: a.battery.labels,
        datasets: [
          { label: 'D-001', data: a.battery.d001, borderColor: '#1D9E75', tension: .4, pointRadius: 2, borderWidth: 2, fill: false },
          { label: 'D-002', data: a.battery.d002, borderColor: '#E24B4A', tension: .4, pointRadius: 2, borderWidth: 2, fill: false, borderDash: [5, 3] },
          { label: 'D-003', data: a.battery.d003, borderColor: '#185FA5', tension: .4, pointRadius: 2, borderWidth: 2, fill: false },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 40, ticks: { font: { size: 10 }, callback: v => v + '%' }, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { ticks: { font: { size: 9 } }, grid: { display: false } } } }
    });
  }

  function buildHeatmap() {
    const hd = document.getElementById('heat-dots');
    if (!hd) return;
    const centers = [{ x:30,y:40 },{ x:65,y:60 },{ x:50,y:25 },{ x:20,y:70 },{ x:80,y:45 }];
    centers.forEach(c => {
      for (let i = 0; i < 10; i++) {
        const d = document.createElement('div');
        const ox = (Math.random() - .5) * 22, oy = (Math.random() - .5) * 22;
        const sz = 7 + Math.random() * 18, op = .12 + Math.random() * .4;
        d.style.cssText = `position:absolute;left:${c.x+ox}%;top:${c.y+oy}%;width:${sz}px;height:${sz}px;border-radius:50%;background:#E24B4A;opacity:${op};transform:translate(-50%,-50%);`;
        hd.appendChild(d);
      }
    });
  }

  return { render };
})();
