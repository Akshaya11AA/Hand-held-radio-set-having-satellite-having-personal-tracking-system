# EmergencyLink — ESP32 Emergency Communication & Satellite Tracking System

A mobile-first web application for managing ESP32-based handheld radio emergency communication and GPS satellite tracking devices.

---

## Quick Start in VS Code

### Option 1 — Live Server (recommended)
1. Install the **Live Server** extension in VS Code (ritwickdey.LiveServer)
2. Right-click `index.html` → **Open with Live Server**
3. App opens at `http://127.0.0.1:5500`

### Option 2 — Direct open
Open `index.html` directly in any modern browser (Chrome, Firefox, Edge, Safari).

> **Note:** The AI assistant requires an Anthropic API key and an HTTP server context (not `file://`). Use Live Server for full AI functionality.

---

## Project Structure

```
emergencylink/
├── index.html              # App shell & page containers
├── css/
│   ├── main.css            # Layout, variables, base styles
│   ├── components.css      # Cards, buttons, badges, forms
│   └── animations.css      # Keyframe animations
├── js/
│   ├── data.js             # Device data store & simulation
│   ├── auth.js             # Login / logout
│   ├── ui.js               # UI controller, navigation, alerts
│   ├── map.js              # GPS tracking map module
│   ├── dashboard.js        # Dashboard page
│   ├── alerts.js           # Alerts page
│   ├── sensors.js          # Sensor monitoring page
│   ├── voice.js            # Voice comms page
│   ├── ai.js               # AI assistant (Claude API)
│   ├── analytics.js        # Charts & analytics page
│   ├── admin.js            # Admin panel
│   └── app.js              # Bootstrap entry point
└── README.md
```

---

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Live stats, device overview, recent events, quick actions |
| **Live Tracking** | Simulated GPS map with device pins, trail history, status |
| **Alerts** | Active emergency panel, full alert log, threshold config |
| **Sensors** | Real-time MPU-6050 data: accelerometer, gyro, temp, battery |
| **Voice** | LoRa voice channel simulation, PTT, waveform visualizer |
| **AI Assistant** | Claude-powered real-time analysis, risk predictions |
| **Analytics** | Trend charts, alert types, battery performance, heatmap |
| **Admin** | Device registration by MAC, manage/remove, system settings |

---

## Device Integration (ESP32)

Each ESP32 device is identified by its unique **MAC address** (format: `AA:BB:CC:DD:EE:FF`).

### Simulated devices
| ID | Name | MAC | Status |
|----|------|-----|--------|
| D-001 | Search unit Alpha | A4:CF:12:8E:3B:01 | Active |
| D-002 | Field unit Bravo | A4:CF:12:8E:3B:02 | Emergency |
| D-003 | Command unit | A4:CF:12:8E:3B:03 | Active |
| D-004 | Medical unit Delta | A4:CF:12:8E:3B:04 | Inactive |
| D-005 | Field unit Echo | A4:CF:12:8E:3B:05 | Active |

### Connecting real ESP32 devices
Replace the simulation in `js/data.js` with real data sources:

```javascript
// MQTT (via mqtt.js library)
const client = mqtt.connect('ws://broker.emqx.io:8083/mqtt');
client.on('message', (topic, payload) => {
  const data = JSON.parse(payload.toString());
  // Update AppData with real sensor values
});

// WebSocket
const ws = new WebSocket('ws://your-esp32-ip:81');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // { mac, accel, gyro, temp, bat, lat, lng, status }
};

// Firebase Realtime Database
import { getDatabase, ref, onValue } from "firebase/database";
const db = getDatabase();
onValue(ref(db, 'devices/D-001'), (snapshot) => {
  const data = snapshot.val();
});
```

---

## AI Assistant Setup

The AI assistant uses the **Anthropic Claude API**. To enable:

1. Get an API key from https://console.anthropic.com
2. In `js/ai.js`, the `fetch` call to `https://api.anthropic.com/v1/messages` requires the key to be passed via a backend proxy (for security — never expose API keys in frontend code)
3. Set up a simple proxy server:

```javascript
// Simple Node.js proxy (server.js)
const express = require('express');
const app = express();
app.use(express.json());
app.post('/api/ai', async (req, res) => {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(req.body)
  });
  res.json(await resp.json());
});
app.listen(3000);
```

Then update `js/ai.js` to call `/api/ai` instead of the Anthropic API directly.

---

## Real-Time Communication

The app is designed to work with:
- **MQTT** (recommended for ESP32) — via `mqtt.js`
- **WebSockets** — via native browser WebSocket API
- **Firebase Realtime Database** — via Firebase SDK

### ESP32 Arduino code example (MQTT publish)
```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

WiFiClient espClient;
PubSubClient client(espClient);

void publishSensorData() {
  StaticJsonDocument<256> doc;
  doc["mac"]    = WiFi.macAddress();
  doc["accel"]  = readAccelerometer();
  doc["gyro"]   = readGyroscope();
  doc["temp"]   = readTemperature();
  doc["bat"]    = readBatteryPercent();
  doc["lat"]    = gps.location.lat();
  doc["lng"]    = gps.location.lng();
  doc["status"] = "active";
  
  char payload[256];
  serializeJson(doc, payload);
  client.publish("emergencylink/devices/D-001", payload);
}
```

---

## Customization

### Add a new device
1. Go to **Admin** tab in the app
2. Enter device name, MAC address, and role
3. Click **Register device**

Or programmatically in `js/data.js`:
```javascript
AppData.addDevice({
  name: 'New unit',
  mac: 'AA:BB:CC:DD:EE:FF',
  role: 'Field unit',
  firmware: 'v3.2.2'
});
```

### Change theme colors
Edit `css/main.css` `:root` variables:
```css
:root {
  --green: #1D9E75;   /* Safe status */
  --amber: #BA7517;   /* Warning status */
  --red:   #E24B4A;   /* Emergency status */
  --blue:  #185FA5;   /* Primary UI color */
}
```

---

## Browser Support
Chrome 90+, Firefox 90+, Safari 14+, Edge 90+

## License
MIT — free for emergency services and humanitarian use.
