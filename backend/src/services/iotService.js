const database = require('../models/database');
const doorService = require('./doorService');

class IoTService {
    constructor() {
        this.io = null;
        this.sensorInterval = null;
        this.detectionThreshold = 200;
        this.currentDistance = 300;
        this.isRunning = false;
    }

    initialize(io) {
        this.io = io;
        this.startSensorSimulation();
    }

    async startSensorSimulation() {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log('Starting IoT sensor simulation');

        const setting = await database.get(
            'SELECT value FROM settings WHERE key = ?',
            ['sensor_update_interval']
        );
        const interval = setting ? parseInt(setting.value) : 500;

        this.sensorInterval = setInterval(() => {
            this.simulateSensorData();
        }, interval);
    }

    simulateSensorData() {
        if (!this.isRunning) return;

        const variation = (Math.random() - 0.5) * 20;
        const humanNearby = Math.random() < 0.1;

        if (humanNearby) {
            this.currentDistance = Math.random() * 100 + 20;
        } else {
            this.currentDistance = Math.max(50, Math.min(400, this.currentDistance + variation));
        }

        const threshold = this.detectionThreshold;

        if (this.currentDistance < threshold && this.currentDistance < 100) {
            this.detectHumanPresence();
        }

        if (this.io) {
            this.io.emit('sensor:distance-update', {
                distance: Math.round(this.currentDistance * 10) / 10,
                timestamp: new Date().toISOString(),
                threshold: threshold
            });
        }
    }

    detectHumanPresence() {
        const previousDetection = this.lastDetectionTime;
        const now = Date.now();
        const cooldownPeriod = 5000;

        if (!previousDetection || (now - previousDetection) > cooldownPeriod) {
            this.lastDetectionTime = now;

            doorService.autoOpen();

            if (this.io) {
                this.io.emit('alert:new', {
                    id: Date.now(),
                    type: 'human_detected',
                    message: 'Human detected within range - Door opening automatically',
                    priority: 'medium',
                    timestamp: new Date().toISOString(),
                    acknowledged: false
                });
            }

            database.run(
                'INSERT INTO alerts (type, message, priority) VALUES (?, ?, ?)',
                ['human_detected', 'Human detected within range', 'medium']
            ).catch(error => console.error('Failed to log human detection:', error));
        }
    }

    async updateSetting(key, value) {
        try {
            await database.run(
                'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
                [value.toString(), key]
            );

            if (key === 'detection_threshold') {
                this.detectionThreshold = parseFloat(value);
            } else if (key === 'sensor_update_interval') {
                if (this.sensorInterval) {
                    clearInterval(this.sensorInterval);
                    this.startSensorSimulation();
                }
            }
        } catch (error) {
            console.error('Failed to update setting:', error);
        }
    }

    async getSystemStats() {
        try {
            const doorStats = await database.get(`
                SELECT
                    COUNT(*) as total_operations,
                    COUNT(CASE WHEN action = 'opened' THEN 1 END) as open_count,
                    COUNT(CASE WHEN action = 'closed' THEN 1 END) as close_count,
                    COUNT(CASE WHEN trigger_type = 'automatic' THEN 1 END) as automatic_count,
                    MAX(timestamp) as last_activity
                FROM door_logs
                WHERE timestamp > datetime('now', '-24 hours')
            `);

            const alertStats = await database.get(`
                SELECT
                    COUNT(*) as total_alerts,
                    COUNT(CASE WHEN acknowledged = FALSE THEN 1 END) as unacknowledged,
                    COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority
                FROM alerts
                WHERE timestamp > datetime('now', '-24 hours')
            `);

            return {
                door: doorStats,
                alerts: alertStats,
                system: {
                    uptime: process.uptime(),
                    sensorActive: this.isRunning,
                    currentThreshold: this.detectionThreshold
                }
            };
        } catch (error) {
            throw new Error('Failed to get system stats');
        }
    }

    stopSensorSimulation() {
        if (this.sensorInterval) {
            clearInterval(this.sensorInterval);
            this.sensorInterval = null;
            this.isRunning = false;
            console.log('IoT sensor simulation stopped');
        }
    }
}

module.exports = new IoTService();