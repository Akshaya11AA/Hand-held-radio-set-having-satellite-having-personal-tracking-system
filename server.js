const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send("🚀 EmergencyLink Server Running");
});

app.post('/api/device', (req, res) => {
    console.log("📡 ESP32 DATA RECEIVED:");
    console.log(req.body);
    res.send("OK");
});

app.listen(3000, '0.0.0.0', () => {
    console.log("Server running on http://0.0.0.0:3000");
});