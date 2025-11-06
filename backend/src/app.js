const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const database = require('./models/database');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', require('./routes/api'));

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('subscribe:door-status', () => {
        socket.join('door-status');
        console.log('Client subscribed to door status updates');
    });

    socket.on('door:control', async (data) => {
        try {
            const { action } = data;
            const doorService = require('./services/doorService');
            await doorService.setDoorState(action);

            io.to('door-status').emit('door:status-update', {
                status: action,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('alert:acknowledge', async (data) => {
        try {
            const { alertId } = data;
            await database.run(
                'UPDATE alerts SET acknowledged = TRUE WHERE id = ?',
                [alertId]
            );

            socket.emit('alert:acknowledged', { alertId });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

async function startServer() {
    try {
        await database.connect();

        const doorService = require('./services/doorService');
        const iotService = require('./services/iotService');

        doorService.initialize(io);
        iotService.initialize(io);

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = { app, io };