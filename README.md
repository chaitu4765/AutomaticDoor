# Automatic Door IoT System

A comprehensive web application for monitoring and controlling an automatic door IoT system with real-time sensor data, alerts, and manual control capabilities.

## Features

- **Real-time Door Status**: Monitor door open/closed state with live updates
- **Sensor Distance Monitoring**: Track distance measurements with visual indicators
- **Automatic Detection**: Human detection within range for automatic door opening
- **Alert System**: Real-time notifications with sound and browser alerts
- **Manual Control**: Remote door open/close operations
- **Settings Configuration**: Customizable detection thresholds and timers
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **WebSocket Communication**: Real-time updates without page refresh

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoT Device    │    │   Backend API   │    │   Web Frontend  │
│  (Sensor +      │    │  (Express +     │    │   (React +      │
│   Door Motor)   │◄──►│   Socket.IO)    │◄──►│   Tailwind)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   Sensor Data          Database (SQLite)        User Interface
   Distance Readings    Alert History            Real-time Status
   Door State           User Preferences         Control Panel
```

## Technology Stack

### Backend
- **Node.js** with Express.js
- **Socket.IO** for real-time communication
- **SQLite** for data storage
- **JWT** for authentication (future enhancement)

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time updates
- **React Router** for navigation

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AutomaticDoor
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the backend server**
   ```bash
   cd ../backend
   npm start
   ```
   The backend will start on `http://localhost:3001`

5. **Start the frontend application**
   ```bash
   cd ../frontend
   npm start
   ```
   The frontend will start on `http://localhost:3000`

## Usage

### Dashboard Features

1. **Door Status Monitor**
   - Real-time door state (open/closed)
   - Visual indicators with color coding
   - Last updated timestamp
   - Auto-close timer display

2. **Sensor Display**
   - Live distance measurements
   - Visual gauge with threshold indicators
   - Detection status (Human/Object/Clear)
   - Color-coded distance ranges

3. **Manual Controls**
   - Open/Close door buttons
   - Emergency stop functionality
   - Safety notices and status indicators
   - Connection status monitoring

4. **Alert System**
   - Real-time alert notifications
   - Sound alerts (configurable)
   - Browser push notifications
   - Alert acknowledgment and history
   - Filtering by type and status

### Settings Configuration

1. **Detection Threshold**: Set maximum detection range (50-400cm)
2. **Auto-Close Timer**: Configure automatic door closing time (10-120s)
3. **Alert Preferences**: Enable/disable sound and browser notifications
4. **Sensor Update Interval**: Adjust sensor reading frequency

## API Endpoints

### Door Operations
- `GET /api/door/status` - Get current door status
- `POST /api/door/control` - Manual door control

### Alerts
- `GET /api/alerts` - Get alert history with pagination
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert

### System
- `GET /api/stats` - Get system statistics
- `GET /api/settings` - Get system settings
- `PUT /api/settings/:key` - Update setting

### Logs
- `GET /api/logs` - Get door operation logs
- `GET /api/sensor/distance` - Get current sensor reading

## WebSocket Events

### Client → Server
- `subscribe:door-status` - Subscribe to door updates
- `door:control` - Manual door control
- `alert:acknowledge` - Acknowledge alert

### Server → Client
- `door:status-update` - Door state changed
- `sensor:distance-update` - New sensor reading
- `alert:new` - New alert generated
- `system:status` - System status update

## Database Schema

### door_logs
- `id` - Primary key
- `action` - Door operation type
- `sensor_distance` - Distance at time of operation
- `trigger_type` - automatic/manual/timeout
- `timestamp` - Operation timestamp

### alerts
- `id` - Primary key
- `type` - Alert category
- `message` - Alert description
- `priority` - high/medium/low
- `acknowledged` - Read status
- `timestamp` - Alert timestamp

### settings
- `id` - Primary key
- `key` - Setting identifier
- `value` - Setting value
- `description` - Setting description
- `updated_at` - Last update timestamp

## Default Settings

- **Detection Threshold**: 200cm (wide range detection)
- **Auto-Close Timer**: 30 seconds
- **Alert Sound**: Enabled
- **Browser Notifications**: Enabled
- **Sensor Update Interval**: 500ms

## Development

### Running in Development Mode

1. **Backend development**
   ```bash
   cd backend
   npm run dev
   ```
   Uses nodemon for automatic restarts

2. **Frontend development**
   ```bash
   cd frontend
   npm start
   ```
   Hot reload enabled

### Project Structure

```
AutomaticDoor/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Helper functions
│   │   └── app.js          # Express app setup
│   ├── database/           # SQLite database files
│   └── server.js           # Server entry point
├── frontend/               # React web application
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript definitions
│   │   └── App.tsx         # Main App component
│   └── package.json
└── README.md
```

## Security Considerations

- Input validation and sanitization
- CORS configuration for API access
- Rate limiting to prevent abuse
- Local SQLite database (no external data exposure)
- Secure WebSocket connections

## Performance Requirements

- Door status updates: <100ms
- Sensor data refresh: 500ms intervals
- Alert notifications: <200ms
- Page load times: <2 seconds
- Memory usage: <100MB total

## Future Enhancements

- Multi-door support
- User authentication
- Mobile application
- Voice control integration
- Advanced analytics
- Email notifications
- Multi-language support

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure backend server is running on port 3001
   - Check firewall settings
   - Verify CORS configuration

2. **Sensor Data Not Updating**
   - Check WebSocket connection status
   - Verify sensor simulation service is running
   - Check browser console for errors

3. **Alert Sound Not Working**
   - Ensure browser allows audio playback
   - Check if sound is enabled in settings
   - Verify browser permissions

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=automatic-door:* npm start
```

## License

This project is licensed under the MIT License.

## Support

For support and questions, please refer to the project documentation or create an issue in the repository.