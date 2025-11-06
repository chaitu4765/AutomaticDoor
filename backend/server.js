const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database(':memory:');

// Create tables
db.serialize(() => {
  // Door logs table
  db.run(`CREATE TABLE door_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    sensor_distance INTEGER,
    trigger_type TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Alerts table
  db.run(`CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL,
    acknowledged INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Settings table
  db.run(`CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default settings
  const defaultSettings = [
    ['detection_threshold', '200', 'Detection range in cm'],
    ['auto_close_timer', '30', 'Auto-close time in seconds'],
    ['alert_sound', 'true', 'Enable alert sound'],
    ['browser_notifications', 'true', 'Enable browser notifications'],
    ['sensor_update_interval', '500', 'Sensor update interval in ms']
  ];

  const stmt = db.prepare('INSERT INTO settings (key, value, description) VALUES (?, ?, ?)');
  defaultSettings.forEach(setting => stmt.run(setting));
  stmt.finalize();
});

// Door state
let doorState = {
  isOpen: false,
  distance: 300,
  autoCloseTimer: null,
  lastUpdated: new Date().toISOString()
};

// Sensor simulation
let sensorInterval;
function startSensorSimulation() {
  sensorInterval = setInterval(() => {
    // Simulate distance readings (50-400 cm)
    doorState.distance = Math.floor(Math.random() * 350) + 50;
    doorState.lastUpdated = new Date().toISOString();
    
    // Emit sensor update
    io.emit('sensor:distance-update', {
      distance: doorState.distance,
      timestamp: doorState.lastUpdated
    });

    // Auto-open logic
    if (doorState.distance < 100 && !doorState.isOpen) {
      openDoor('automatic');
    }
  }, 500);
}

function openDoor(triggerType = 'manual') {
  if (!doorState.isOpen) {
    doorState.isOpen = true;
    doorState.lastUpdated = new Date().toISOString();
    
    // Log to database
    db.run('INSERT INTO door_logs (action, sensor_distance, trigger_type) VALUES (?, ?, ?)',
      ['open', doorState.distance, triggerType]);
    
    // Emit status update
    io.emit('door:status-update', doorState);
    
    // Set auto-close timer
    if (doorState.autoCloseTimer) clearTimeout(doorState.autoCloseTimer);
    doorState.autoCloseTimer = setTimeout(() => {
      closeDoor('timeout');
    }, 30000);
    
    // Create alert
    createAlert('door_opened', `Door opened (${triggerType})`, 'medium');
  }
}

function closeDoor(triggerType = 'manual') {
  if (doorState.isOpen) {
    doorState.isOpen = false;
    doorState.lastUpdated = new Date().toISOString();
    
    // Log to database
    db.run('INSERT INTO door_logs (action, sensor_distance, trigger_type) VALUES (?, ?, ?)',
      ['close', doorState.distance, triggerType]);
    
    // Emit status update
    io.emit('door:status-update', doorState);
    
    // Clear auto-close timer
    if (doorState.autoCloseTimer) {
      clearTimeout(doorState.autoCloseTimer);
      doorState.autoCloseTimer = null;
    }
  }
}

function createAlert(type, message, priority) {
  db.run('INSERT INTO alerts (type, message, priority) VALUES (?, ?, ?)',
    [type, message, priority], function(err) {
      if (!err) {
        io.emit('alert:new', {
          id: this.lastID,
          type,
          message,
          priority,
          acknowledged: false,
          timestamp: new Date().toISOString()
        });
      }
    });
}

// REST API Endpoints

// Door operations
app.get('/api/door/status', (req, res) => {
  res.json(doorState);
});

app.post('/api/door/control', (req, res) => {
  const { action } = req.body;
  
  if (action === 'open') {
    openDoor('manual');
    res.json({ success: true, message: 'Door opened' });
  } else if (action === 'close') {
    closeDoor('manual');
    res.json({ success: true, message: 'Door closed' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid action' });
  }
});

// Alerts
app.get('/api/alerts', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  db.all('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ? OFFSET ?',
    [limit, offset], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    });
});

app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const { id } = req.params;
  
  db.run('UPDATE alerts SET acknowledged = 1 WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true, changes: this.changes });
    }
  });
});

// Settings
app.get('/api/settings', (req, res) => {
  db.all('SELECT * FROM settings', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.put('/api/settings/:key', (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  
  db.run('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
    [value, key], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true, changes: this.changes });
      }
    });
});

// Logs
app.get('/api/logs', (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  
  db.all('SELECT * FROM door_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?',
    [limit, offset], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    });
});

// Sensor
app.get('/api/sensor/distance', (req, res) => {
  res.json({ distance: doorState.distance, timestamp: doorState.lastUpdated });
});

// System stats
app.get('/api/stats', (req, res) => {
  db.get('SELECT COUNT(*) as totalLogs FROM door_logs', (err, logCount) => {
    db.get('SELECT COUNT(*) as totalAlerts FROM alerts', (err2, alertCount) => {
      res.json({
        totalLogs: logCount?.totalLogs || 0,
        totalAlerts: alertCount?.totalAlerts || 0,
        currentDistance: doorState.distance,
        doorStatus: doorState.isOpen ? 'open' : 'closed',
        uptime: process.uptime()
      });
    });
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current door status
  socket.emit('door:status-update', doorState);
  
  // Handle door control
  socket.on('door:control', (data) => {
    if (data.action === 'open') {
      openDoor('manual');
    } else if (data.action === 'close') {
      closeDoor('manual');
    }
  });
  
  // Handle alert acknowledgment
  socket.on('alert:acknowledge', (data) => {
    db.run('UPDATE alerts SET acknowledged = 1 WHERE id = ?', [data.id]);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Automatic Door IoT Server running on port ${PORT}`);
  startSensorSimulation();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  clearInterval(sensorInterval);
  db.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
