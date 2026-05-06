/* ═══════════════════════════════════════════════════════════
   EmergencyLink — Voice Module (js/voice.js)
   ═══════════════════════════════════════════════════════════ */
const Voice = (() => {
  let _listening = false;
  let _waveAnim = null;
  let _pttActive = false;

  function render() {
    const page = document.getElementById('page-voice');
    const voiceLog = AppData.getVoiceLog();
    const devices = AppData.getDevices();

    page.innerHTML = `
      <div class="card" style="text-align:center;">
        <div class="card-title">Voice channel</div>
        <select id="voice-device" style="width:auto;margin:0 auto 16px;">
          ${devices.map(d => `<option>${d.id} — ${d.name}</option>`).join('')}
        </select>
        <div style="display:flex;justify-content:center;margin-bottom:16px;">
          <div class="voice-wave" id="voice-wave">
            ${Array.from({length:12}, (_,i) => {
              const h = [10,18,28,16,32,12,24,8,20,30,14,22][i];
              return `<div class="wave-bar" style="height:${h}px;"></div>`;
            }).join('')}
          </div>
        </div>
        <div style="display:flex;gap:16px;justify-content:center;align-items:center;margin-bottom:12px;">
          <button class="btn btn-primary" id="listen-btn" onclick="Voice.toggleListen()">▶ Listen</button>
          <div class="ptt-btn" id="ptt-btn"
            onmousedown="Voice.startPTT()" onmouseup="Voice.endPTT()"
            ontouchstart="Voice.startPTT()" ontouchend="Voice.endPTT()">🎤</div>
          <button class="btn" onclick="Voice.playback()">⏮ Replay</button>
        </div>
        <div style="font-size:11px;color:var(--text-hint);" id="voice-status">Channel idle — LoRa 433 MHz · SF9</div>
      </div>

      <div class="card">
        <div class="card-title">Channel config</div>
        <div class="field-row">
          <label class="field-label">Frequency band</label>
          <select><option selected>433 MHz (LoRa)</option><option>915 MHz (LoRa)</option><option>2.4 GHz (WiFi)</option></select>
        </div>
        <div class="field-row">
          <label class="field-label">Spreading factor</label>
          <select><option>SF7 (fast, short range)</option><option selected>SF9 (balanced)</option><option>SF12 (long range, slow)</option></select>
        </div>
        <div class="setting-row">
          <div><div class="setting-title">Squelch</div><div class="setting-sub">Suppress background noise</div></div>
          <label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label>
        </div>
        <div class="setting-row">
          <div><div class="setting-title">Auto-record</div><div class="setting-sub">Save all received audio</div></div>
          <label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Voice log</div>
        <div class="scroll-y" style="max-height:220px;">
          ${voiceLog.map(v => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:0.5px solid var(--border);">
              <span style="font-size:16px;">${v.dir === 'in' ? '📥' : '📤'}</span>
              <div style="flex:1;">
                <div style="font-size:11px;font-weight:500;">${v.dev} · ${v.time}</div>
                <div style="font-size:10px;color:var(--text-hint);">${v.note}</div>
              </div>
              <span style="font-size:10px;color:var(--text-secondary);">${v.dur}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function toggleListen() {
    _listening = !_listening;
    const btn = document.getElementById('listen-btn');
    const status = document.getElementById('voice-status');
    if (_listening) {
      btn.textContent = '⏹ Stop';
      btn.classList.add('btn-primary');
      status.textContent = 'Receiving audio — LoRa 433 MHz';
      _waveAnim = setInterval(animateWave, 120);
    } else {
      btn.textContent = '▶ Listen';
      btn.classList.remove('btn-primary');
      status.textContent = 'Channel idle — LoRa 433 MHz · SF9';
      clearInterval(_waveAnim);
      resetWave();
    }
  }

  function animateWave() {
    document.querySelectorAll('.wave-bar').forEach(b => {
      b.style.height = Math.round(6 + Math.random() * 34) + 'px';
    });
  }

  function resetWave() {
    const h = [10,18,28,16,32,12,24,8,20,30,14,22];
    document.querySelectorAll('.wave-bar').forEach((b,i) => { b.style.height = h[i] + 'px'; });
  }

  function startPTT() {
    _pttActive = true;
    const btn = document.getElementById('ptt-btn');
    if (btn) btn.classList.add('active');
    const status = document.getElementById('voice-status');
    if (status) status.textContent = 'Transmitting — hold button...';
    _waveAnim = setInterval(animateWave, 100);
  }

  function endPTT() {
    _pttActive = false;
    const btn = document.getElementById('ptt-btn');
    if (btn) btn.classList.remove('active');
    const status = document.getElementById('voice-status');
    if (status) status.textContent = 'Transmission ended · LoRa 433 MHz';
    clearInterval(_waveAnim);
    resetWave();
  }

  function playback() {
    const status = document.getElementById('voice-status');
    if (status) { status.textContent = 'Playing back last recording...'; }
    _waveAnim = setInterval(animateWave, 140);
    setTimeout(() => { clearInterval(_waveAnim); resetWave(); if (status) status.textContent = 'Playback ended'; }, 4000);
  }

  return { render, toggleListen, startPTT, endPTT, playback };
})();
