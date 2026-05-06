/* ═══════════════════════════════════════════════════════════
   EmergencyLink — AI Assistant (js/ai.js)
   Integrates with Anthropic Claude API for real-time analysis
   ═══════════════════════════════════════════════════════════ */
const AIPage = (() => {

  let _initialized = false;

  function render() {
    const page = document.getElementById('page-ai');
    page.innerHTML = `
      <!-- Header -->
      <div class="card" style="background:var(--blue-bg);border-color:rgba(24,95,165,.25);">
        <div style="display:flex;gap:12px;align-items:center;">
          <div style="width:36px;height:36px;border-radius:var(--r-md);background:var(--blue);display:flex;align-items:center;justify-content:center;font-size:18px;color:white;flex-shrink:0;">🤖</div>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--blue-text);">EmergencyLink AI</div>
            <div style="font-size:11px;color:var(--blue);margin-top:2px;">Powered by Claude · Analyzing live sensor data</div>
          </div>
          <span class="badge badge-green" style="margin-left:auto;"><span class="dot dot-green"></span>Online</span>
        </div>
      </div>

      <!-- Insights -->
      <div class="card">
        <div class="card-title">AI insights</div>
        <div id="ai-insights"></div>
      </div>

      <!-- Chat -->
      <div class="card">
        <div class="card-title">Assistant</div>
        <div class="ai-msgs scroll-y" style="max-height:280px;" id="ai-msgs"></div>
        <div class="ai-input-row">
          <input type="text" id="ai-input" placeholder="Ask about device data, risks, actions..." onkeydown="if(event.key==='Enter')AIPage.sendMessage()" />
          <button class="btn btn-primary" onclick="AIPage.sendMessage()">↗</button>
        </div>
        <div id="ai-thinking" style="display:none;padding-top:8px;">
          <div class="loading-dots"><span></span><span></span><span></span></div>
        </div>
      </div>

      <!-- Risk Predictions -->
      <div class="card">
        <div class="card-title">Risk predictions</div>
        <div id="risk-predictions"></div>
      </div>

      <!-- Suggested actions -->
      <div class="card">
        <div class="card-title">Suggested actions</div>
        <div style="display:flex;flex-direction:column;gap:8px;" id="suggested-actions"></div>
      </div>`;

    renderInsights();
    renderRisk();
    renderSuggestedActions();
    if (!_initialized) { addMsg('ai', buildGreeting()); _initialized = true; }
  }

  function buildGreeting() {
    const devices = AppData.getDevices();
    const emerg = devices.filter(d => d.status === 'emergency');
    const inactive = devices.filter(d => d.status === 'inactive');
    return `Hello, Admin. I've analyzed all ${devices.length} connected devices.\n\n${emerg.length > 0 ? `⚠ ${emerg.map(d=>d.id).join(', ')} show${emerg.length>1?'':'s'} emergency status — immediate intervention recommended.\n\n` : ''}${inactive.length > 0 ? `🔋 ${inactive.map(d=>d.id).join(', ')} offline — check battery or connectivity.\n\n` : ''}Ask me anything about your devices, risks, or recommended actions.`;
  }

  function renderInsights() {
    const el = document.getElementById('ai-insights');
    if (!el) return;
    el.innerHTML = AppData.getAIInsights().map(i => {
      const col = i.sev === 'red' ? 'var(--red)' : i.sev === 'amber' ? 'var(--amber)' : 'var(--green)';
      return `<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:0.5px solid var(--border);">
        <span style="font-size:18px;flex-shrink:0;">${i.icon}</span>
        <div>
          <div style="font-size:12px;font-weight:600;color:${col};margin-bottom:3px;">${i.title}</div>
          <div style="font-size:11px;color:var(--text-secondary);line-height:1.5;">${i.body}</div>
        </div>
      </div>`;
    }).join('');
  }

  function renderRisk() {
    const el = document.getElementById('risk-predictions');
    if (!el) return;
    el.innerHTML = AppData.getRiskPredictions().map(r => {
      const col = r.risk > 70 ? 'var(--red)' : r.risk > 40 ? 'var(--amber)' : 'var(--green)';
      return `<div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <span style="font-size:12px;font-weight:600;">${r.dev}</span>
          <span style="font-size:12px;font-weight:600;color:${col};">${r.risk}% risk</span>
        </div>
        <div class="risk-bar-wrap"><div class="risk-bar" style="width:${r.risk}%;background:${col};"></div></div>
        <div style="font-size:10px;color:var(--text-hint);margin-top:3px;">${r.label}</div>
      </div>`;
    }).join('');
  }

  function renderSuggestedActions() {
    const el = document.getElementById('suggested-actions');
    if (!el) return;
    const actions = [
      { icon: '🏃', text: 'Dispatch rescue team to D-002 last known location', urgent: true },
      { icon: '🔋', text: 'Return D-004 to base for battery replacement', urgent: false },
      { icon: '📡', text: 'Deploy LoRa relay near D-002 dead zone area', urgent: false },
    ];
    el.innerHTML = actions.map(a => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;background:${a.urgent?'var(--red-bg)':'var(--bg-secondary)'};border-radius:var(--r-md);border:0.5px solid ${a.urgent?'var(--red)':'var(--border)'};">
        <span style="font-size:16px;">${a.icon}</span>
        <div style="flex:1;font-size:11px;color:${a.urgent?'var(--red-text)':'var(--text-primary)'};line-height:1.4;">${a.text}</div>
        ${a.urgent ? '<span class="badge badge-red">Urgent</span>' : ''}
      </div>`).join('');
  }

  async function sendMessage() {
    const input = document.getElementById('ai-input');
    const q = input.value.trim();
    if (!q) return;
    addMsg('user', q);
    input.value = '';

    const thinking = document.getElementById('ai-thinking');
    if (thinking) thinking.style.display = 'block';

    const devices = AppData.getDevices();
    const deviceCtx = devices.map(d =>
      `${d.id} (${d.name}, MAC:${d.mac}): status=${d.status}, battery=${d.bat}%, signal=${d.signal}dBm, GPS=${d.lat.toFixed(4)}N,${d.lng.toFixed(4)}E`
    ).join('\n');
    const alerts = AppData.getAlertsLog().slice(0,4).map(a => `[${a.time}] ${a.dev}: ${a.msg}`).join('\n');

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are an AI assistant embedded in an ESP32-based emergency radio and GPS satellite tracking system used by field rescue teams. You have access to real-time device data below. Be concise, safety-focused, and actionable. Format key points clearly. Use device IDs (D-001 etc) when referring to devices.\n\nCurrent devices:\n${deviceCtx}\n\nRecent alerts:\n${alerts}`,
          messages: [{ role: 'user', content: q }]
        })
      });
      const data = await resp.json();
      const txt = data.content?.map(c => c.text || '').join('') || 'No response from AI.';
      if (thinking) thinking.style.display = 'none';
      addMsg('ai', txt);
    } catch (e) {
      if (thinking) thinking.style.display = 'none';
      addMsg('ai', 'AI unavailable (offline/no API key). Based on local data:\n\n⚠ D-002 requires immediate attention — fall detected with no response.\n🔋 D-004 battery critically low (21%).');
    }
  }

  function addMsg(role, text) {
    const msgs = document.getElementById('ai-msgs');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'ai-msg ' + role;
    div.style.whiteSpace = 'pre-line';
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  return { render, sendMessage };
})();
