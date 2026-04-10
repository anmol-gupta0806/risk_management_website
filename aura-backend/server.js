const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initialize the Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow connections from frontend
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit to allow large base64 hotel maps
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// In-memory arrays
let activeAlerts = [];
let hotels = []; // { hotelId, name, passcode, mapBase64 }

// Pre-fill a demo hotel for convenience if needed, but let's stick to empty per requirements.
// You must register a hotel first before using the system.

// Socket connection listener
io.on('connection', (socket) => {
  console.log('✅ A client connected:', socket.id);
  
  socket.on('join_hotel', (hotelId) => {
    socket.join(hotelId);
    console.log(`🔌 Client ${socket.id} joined hotel room: ${hotelId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ A client disconnected:', socket.id);
  });
});

// --- ROUTES ---

app.get('/api/health', (req, res) => {
    res.json({ status: "Aura Backend is ALIVE and running!" });
});

// Register a new hotel
app.post('/api/hotels/register', (req, res) => {
    const { hotelId, name, passcode, mapBase64 } = req.body;
    if (!hotelId || !name || !passcode) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (hotels.find(h => h.hotelId === hotelId)) {
        return res.status(400).json({ success: false, message: 'Hotel ID already exists' });
    }
    hotels.push({ hotelId, name, passcode, mapBase64: mapBase64 || null });
    console.log(`🏨 New Hotel Registered: ${name} [${hotelId}]`);
    res.json({ success: true, message: 'Hotel registered successfully' });
});

app.post('/api/alerts/report', async (req, res) => {
    const alertData = req.body;
    
    if (!alertData.hotelId) return res.status(400).json({ success: false, message: 'Missing hotelId' });

    const newAlert = {
        id: Date.now().toString(),
        type: alertData.emergencyType || 'UNKNOWN',
        time: new Date().toLocaleTimeString(),
        createdAt: Date.now(),
        acknowledgedBy: null,
        isSevere: false,
        status: 'active',
        location: alertData.location || 'Unknown Location',
        guestId: alertData.guestId || 'Unknown Guest',
        message: alertData.rawMessage || '',
        hotelId: alertData.hotelId
    };

    // Criticality Check
    const sameTypeAlerts = activeAlerts.filter(a => a.hotelId === newAlert.hotelId && a.type === newAlert.type && !a.acknowledgedBy);
    if (sameTypeAlerts.length >= 3) { 
        // 3 existing + 1 new = 4 total
        newAlert.isSevere = true;
        sameTypeAlerts.forEach(a => a.isSevere = true);
        console.log(`⚠️ CRITICALITY ESCALATED for type ${newAlert.type} at ${newAlert.hotelId}!`);
        io.to(newAlert.hotelId).emit('criticality_escalated', { type: newAlert.type, count: sameTypeAlerts.length + 1 });
    }

    activeAlerts.unshift(newAlert);
    console.log(`🚨 INCOMING ALERT [${newAlert.hotelId}]:`, newAlert);

    // Broadcast the new alert to the specific hotel room
    io.to(newAlert.hotelId).emit('new_alert', newAlert);

    let guestInstruction = `Your ${newAlert.type} alert has been received. Please stay safe.`;

    const hotel = hotels.find(h => h.hotelId === alertData.hotelId);
    if (hotel && hotel.mapBase64) {
        try {
            let mimeType = 'image/jpeg';
            let base64Data = hotel.mapBase64;
            const matches = hotel.mapBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                mimeType = matches[1];
                base64Data = matches[2];
            }

            const prompt = `You are a strict emergency response AI. You have a hotel floorplan/map. 
The current emergency is a ${newAlert.type} located at ${newAlert.location}. 
Determine the safest evacuation instructions for the guest located at ${newAlert.location}. 
Tell them where to go and what to avoid. Maximum 2 extremely clear sentences.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    prompt,
                    { inlineData: { data: base64Data, mimeType: mimeType } }
                ]
            });
            guestInstruction = response.text.trim();
        } catch (err) {
            console.error('Gemini error on SOS report:', err);
        }
    }

    res.json({ 
        success: true,
        guestInstruction,
        estimatedResponse: "2"
    });
});

app.post('/api/alerts/silent', (req, res) => {
    const { guestId, location, pattern, hotelId } = req.body;
    if (!hotelId) return res.status(400).json({ success: false, message: 'Missing hotelId' });

    const newAlert = {
        id: Date.now().toString(),
        type: 'SECURITY (SILENT)',
        time: new Date().toLocaleTimeString(),
        createdAt: Date.now(),
        acknowledgedBy: null,
        isSevere: false,
        status: 'active',
        location: location || 'Unknown',
        guestId: guestId,
        message: `Silent covert request: ${pattern}`,
        hotelId: hotelId
    };

    activeAlerts.unshift(newAlert);
    console.log(`🤫 SILENT ALERT [${hotelId}]:`, newAlert);

    io.to(hotelId).emit('new_alert', newAlert);
    res.json({ success: true });
});

app.post('/api/iot/sensor', (req, res) => {
    const { hotelId, sensorType, reading, threshold, location } = req.body;
    
    if (!hotelId) return res.status(400).json({ success: false, message: 'Missing hotelId' });

    let isEmergency = false;
    let message = '';
    
    // Simulate threshold check, e.g., if reading > threshold
    if (reading > threshold) {
        if (sensorType === 'HEAT') {
            isEmergency = true;
            message = `Heat sensor triggered! Reading: ${reading}°C (Threshold: ${threshold}°C)`;
        } else if (sensorType === 'SMOKE') {
            isEmergency = true;
            message = `Smoke sensor triggered! Level: ${reading}`;
        }
    }

    if (isEmergency) {
        const newAlert = {
            id: Date.now().toString(),
            type: 'IOT_SENSOR',
            time: new Date().toLocaleTimeString(),
            createdAt: Date.now(),
            acknowledgedBy: null,
            isSevere: true, // IoT triggers might be severe by default
            status: 'active',
            location: location || 'Unknown Zone',
            guestId: 'SYSTEM',
            message: message,
            hotelId: hotelId
        };
        
        activeAlerts.unshift(newAlert);
        console.log(`🤖 IOT SENSOR ALERT [${hotelId}]:`, newAlert);
        io.to(hotelId).emit('new_alert', newAlert);
    }
    
    res.json({ success: true, triggered: isEmergency });
});

// NEW: Gemini Evacuation Routing Endpoint
app.post('/api/intelligence/evacuation', async (req, res) => {
    const { hotelId, incidentDetails } = req.body;
    
    if (!hotelId || !incidentDetails) {
        return res.status(400).json({ success: false, message: 'Missing hotelId or incidentDetails' });
    }

    const hotel = hotels.find(h => h.hotelId === hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    if (!hotel.mapBase64) return res.status(400).json({ success: false, message: 'No hotel map registered' });

    try {
        // Extract the mime type and the raw base64 data
        let mimeType = 'image/jpeg';
        let base64Data = hotel.mapBase64;
        
        const matches = hotel.mapBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Data = matches[2];
        }

        const prompt = `You are a strict emergency response AI. You have been provided with a hotel floorplan/map document. 
The current emergency is: ${incidentDetails}. 
Based strictly on the map, determine the safest general evacuation instructions for all guests. 
Identify areas, wings, or stairwells to avoid, and point them towards the safest exits. 
Keep your response to a maximum of 3 extremely clear, actionable, life-saving sentences. Do not use markdown format.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                { inlineData: { data: base64Data, mimeType: mimeType } }
            ]
        });

        res.json({ success: true, instruction: response.text.trim() });
    } catch (err) {
        console.error('Gemini error:', err);
        res.status(500).json({ success: false, message: 'AI processing failed' });
    }
});

// NEW: Mass Broadcast Prompt Endpoint
app.post('/api/alerts/mass-prompt', (req, res) => {
    const { hotelId, message } = req.body;
    if (!hotelId || !message) return res.status(400).json({ success: false, message: 'Missing fields' });

    console.log(`📢 MASS BROADCAST [${hotelId}]: ${message}`);
    // Emit to everyone in the room except staff (or let staff ignore it on frontend)
    io.to(hotelId).emit('mass_safety_prompt', { message, timestamp: new Date().toISOString() });
    res.json({ success: true });
});

app.post('/api/safety/checkin', (req, res) => {
    const { guestId, location, hotelId, headcount, status } = req.body;
    console.log(`✅ Guest ${guestId} checked in at ${location} [${hotelId}] | Headcount: ${headcount} | Status: ${status}`);
    io.to(hotelId).emit('guest_safe', { guestId, location, headcount: headcount || 1, status: status || 'SAFE' });
    res.json({ success: true });
});

// Route for the Staff Dashboard to fetch all current alerts FOR THEIR HOTEL
app.get('/api/alerts', (req, res) => {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ success: false, message: 'Missing hotelId' });
    
    // Cleanup old resolved alerts (older than 2 hours)
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const now = Date.now();
    activeAlerts = activeAlerts.filter(a => {
        if (a.status === 'resolved' && (now - a.resolvedAt) > TWO_HOURS) return false;
        return true;
    });

    const hotelAlerts = activeAlerts.filter(a => a.hotelId === hotelId);
    res.json(hotelAlerts);
});

// Route to resolve/clear an alert from the dashboard
app.post('/api/resolve-alert', (req, res) => {
    const { id, staffName } = req.body;
    const alert = activeAlerts.find(a => a.id === id);
    if (alert) {
        alert.status = 'resolved';
        alert.resolvedAt = Date.now();
        alert.resolvedBy = staffName || 'Staff';
        io.to(alert.hotelId).emit('alert_updated', alert);
    }
    res.json({ success: true, message: "Alert resolved" });
});

// NEW: Route to acknowledge an alert
app.post('/api/alerts/acknowledge', (req, res) => {
    const { id, staffName } = req.body;
    const alert = activeAlerts.find(a => a.id === id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    
    alert.acknowledgedBy = staffName || 'Staff';
    alert.isSevere = false; // Acknowledgement de-escalates severity
    console.log(`👮 Alert ${id} acknowledged by ${staffName}`);
    
    io.to(alert.hotelId).emit('alert_updated', alert);
    res.json({ success: true, message: "Alert acknowledged", alert });
});

// AUTH ROUTES
app.post('/api/auth/staff', (req, res) => {
    const { hotelId, passcode, staffName } = req.body;
    const hotel = hotels.find(h => h.hotelId === hotelId);
    
    if (!hotel) {
        return res.status(404).json({ success: false, message: 'Hotel Environment Not Found' });
    }
    
    if (hotel.passcode === passcode) {
        res.json({ success: true, token: 'staff-token-1234', hotelName: hotel.name, hotelId, name: staffName || 'Staff' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Clearance Code' });
    }
});

app.post('/api/auth/guest', (req, res) => {
    const { hotelId, name, room } = req.body;
    if (!name || !room || !hotelId) {
        return res.status(400).json({ success: false, message: 'Hotel ID, Name and Room required' });
    }
    
    const hotel = hotels.find(h => h.hotelId === hotelId);
    if (!hotel) {
        return res.status(404).json({ success: false, message: 'Hotel Environment Not Found' });
    }

    const guestId = `G-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    res.json({ success: true, token: 'guest-temp-token', guestId, name, room, hotelId, hotelName: hotel.name });
});

// --- START THE SERVER ---
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});