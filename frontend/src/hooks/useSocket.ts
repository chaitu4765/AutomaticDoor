import { useEffect, useState } from 'react';
import socketService from '../services/socket';
import { DoorStatus, SensorData, Alert } from '../types';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [doorStatus, setDoorStatus] = useState<DoorStatus | null>(null);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        await socketService.connect();
        setIsConnected(true);

        socketService.subscribeToDoorStatus();

        socketService.on('door:status-update', (data: DoorStatus) => {
          setDoorStatus(data);
        });

        socketService.on('sensor:distance-update', (data: SensorData) => {
          setSensorData(data);
        });

        socketService.on('alert:new', (alert: Alert) => {
          setAlerts(prev => [alert, ...prev.slice(0, 49)]);
        });

        socketService.on('system:status', () => {
          console.log('System status received');
        });

        socketService.on('alert:acknowledged', ({ alertId }) => {
          setAlerts(prev => prev.map(alert =>
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
          ));
        });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
        setIsConnected(false);
      }
    };

    initializeSocket();

    return () => {
      socketService.disconnect();
      setIsConnected(false);
    };
  }, []);

  const controlDoor = (action: 'open' | 'close') => {
    socketService.controlDoor(action);
  };

  const acknowledgeAlert = (alertId: number) => {
    socketService.acknowledgeAlert(alertId);
  };

  return {
    isConnected,
    doorStatus,
    sensorData,
    alerts,
    controlDoor,
    acknowledgeAlert,
    connectionStatus: socketService.getConnectionStatus()
  };
};