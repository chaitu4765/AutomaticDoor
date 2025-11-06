const database = require('../models/database');

class DoorService {
    constructor() {
        this.currentStatus = 'closed';
        this.io = null;
        this.autoCloseTimeout = null;
    }

    initialize(io) {
        this.io = io;
    }

    async getDoorStatus() {
        try {
            const setting = await database.get(
                'SELECT value FROM settings WHERE key = ?',
                ['auto_close_timer']
            );

            return {
                status: this.currentStatus,
                timestamp: new Date().toISOString(),
                autoCloseTimer: setting ? parseInt(setting.value) : 30
            };
        } catch (error) {
            throw new Error('Failed to get door status');
        }
    }

    async setDoorState(state) {
        try {
            const previousState = this.currentStatus;
            this.currentStatus = state;

            const sensorDistance = Math.random() * 50 + 100;

            await database.run(
                'INSERT INTO door_logs (action, sensor_distance, trigger_type) VALUES (?, ?, ?)',
                [
                    state === 'open' ? 'opened' : 'closed',
                    sensorDistance,
                    'manual'
                ]
            );

            const alertMessage = state === 'open'
                ? 'Door opened manually'
                : 'Door closed manually';

            await this.createAlert('door_operation', alertMessage, 'medium');

            if (state === 'open') {
                this.startAutoCloseTimer();
            } else {
                this.clearAutoCloseTimer();
            }

            if (this.io) {
                this.io.to('door-status').emit('door:status-update', {
                    status: state,
                    timestamp: new Date().toISOString(),
                    trigger: 'manual'
                });
            }

            return { status: state, timestamp: new Date().toISOString() };
        } catch (error) {
            throw new Error(`Failed to set door state: ${error.message}`);
        }
    }

    async autoOpen() {
        try {
            if (this.currentStatus === 'closed') {
                await this.setDoorState('open');

                await database.run(
                    'INSERT INTO door_logs (action, sensor_distance, trigger_type) VALUES (?, ?, ?)',
                    ['opened', null, 'automatic']
                );

                await this.createAlert('door_operation', 'Door opened automatically', 'medium');

                if (this.io) {
                    this.io.to('door-status').emit('door:status-update', {
                        status: 'open',
                        timestamp: new Date().toISOString(),
                        trigger: 'automatic'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to auto open door:', error);
        }
    }

    async autoClose() {
        try {
            if (this.currentStatus === 'open') {
                await this.setDoorState('closed');

                await database.run(
                    'INSERT INTO door_logs (action, sensor_distance, trigger_type) VALUES (?, ?, ?)',
                    ['closed', null, 'timeout']
                );

                await this.createAlert('door_operation', 'Door closed automatically', 'low');

                if (this.io) {
                    this.io.to('door-status').emit('door:status-update', {
                        status: 'closed',
                        timestamp: new Date().toISOString(),
                        trigger: 'timeout'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to auto close door:', error);
        }
    }

    startAutoCloseTimer() {
        this.clearAutoCloseTimer();

        database.get('SELECT value FROM settings WHERE key = ?', ['auto_close_timer'])
            .then(setting => {
                const timerSeconds = setting ? parseInt(setting.value) : 30;
                this.autoCloseTimeout = setTimeout(() => {
                    this.autoClose();
                }, timerSeconds * 1000);
            })
            .catch(error => console.error('Failed to get auto-close timer:', error));
    }

    clearAutoCloseTimer() {
        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
            this.autoCloseTimeout = null;
        }
    }

    async createAlert(type, message, priority = 'medium') {
        try {
            const result = await database.run(
                'INSERT INTO alerts (type, message, priority) VALUES (?, ?, ?)',
                [type, message, priority]
            );

            if (this.io) {
                this.io.emit('alert:new', {
                    id: result.id,
                    type,
                    message,
                    priority,
                    timestamp: new Date().toISOString(),
                    acknowledged: false
                });
            }

            return result.id;
        } catch (error) {
            console.error('Failed to create alert:', error);
        }
    }

    async getDoorLogs(limit = 50) {
        try {
            const logs = await database.all(
                'SELECT * FROM door_logs ORDER BY timestamp DESC LIMIT ?',
                [limit]
            );
            return logs;
        } catch (error) {
            throw new Error('Failed to get door logs');
        }
    }
}

module.exports = new DoorService();