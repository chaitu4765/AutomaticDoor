const express = require('express');
const router = express.Router();
const doorService = require('../services/doorService');
const iotService = require('../services/iotService');
const database = require('../models/database');

router.get('/door/status', async (req, res) => {
    try {
        const status = await doorService.getDoorStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/door/control', async (req, res) => {
    try {
        const { action } = req.body;

        if (!action || !['open', 'close'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid action. Must be "open" or "close"'
            });
        }

        const result = await doorService.setDoorState(action);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/alerts', async (req, res) => {
    try {
        const { page = 1, limit = 20, type, acknowledged } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM alerts WHERE 1=1';
        const params = [];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        if (acknowledged !== undefined) {
            query += ' AND acknowledged = ?';
            params.push(acknowledged === 'true');
        }

        query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const alerts = await database.all(query, params);
        const totalResult = await database.get(
            `SELECT COUNT(*) as total FROM (${query.replace(' LIMIT ? OFFSET ?', '')})`,
            params.slice(0, -2)
        );

        res.json({
            success: true,
            data: {
                alerts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalResult.total,
                    pages: Math.ceil(totalResult.total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/alerts/:id/acknowledge', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await database.run(
            'UPDATE alerts SET acknowledged = TRUE WHERE id = ?',
            [id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        res.json({ success: true, message: 'Alert acknowledged' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const stats = await iotService.getSystemStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/logs', async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const logs = await doorService.getDoorLogs(parseInt(limit));
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/settings', async (req, res) => {
    try {
        const settings = await database.all('SELECT * FROM settings ORDER BY key');
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/settings/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (!value) {
            return res.status(400).json({
                success: false,
                error: 'Value is required'
            });
        }

        await iotService.updateSetting(key, value);

        res.json({ success: true, message: 'Setting updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/sensor/distance', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                distance: Math.round((Math.random() * 50 + 100) * 10) / 10,
                timestamp: new Date().toISOString(),
                threshold: 200
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;