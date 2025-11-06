import React from 'react';
import { DoorStatus, SensorData } from '../types';
import DoorControl from './DoorControl';
import SensorDisplay from './SensorDisplay';
import AlertSystem from './AlertSystem';

interface DashboardProps {
  doorStatus: DoorStatus | null;
  sensorData: SensorData | null;
  isConnected: boolean;
  onControlDoor: (action: 'open' | 'close') => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  doorStatus,
  sensorData,
  isConnected,
  onControlDoor
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'open':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'closed':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'open':
        return '🚪';
      case 'closed':
        return '🔒';
      default:
        return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Automatic Door IoT System
              </h1>
              <p className="text-gray-600 mt-2">
                Monitor and control your automatic door remotely
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                isConnected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                } ${isConnected ? 'connection-indicator' : ''}`}></div>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Door Status
                </h2>
                <div className={`px-4 py-2 rounded-lg border-2 font-medium text-lg ${
                  getStatusColor(doorStatus?.status)
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getStatusIcon(doorStatus?.status)}</span>
                    <span className="capitalize">{doorStatus?.status || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                  <p className="text-lg font-medium text-gray-900">
                    {doorStatus?.timestamp
                      ? new Date(doorStatus.timestamp).toLocaleTimeString()
                      : 'Never'
                    }
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Auto-Close Timer</p>
                  <p className="text-lg font-medium text-gray-900">
                    {doorStatus?.autoCloseTimer || 30}s
                  </p>
                </div>
              </div>

              {doorStatus?.trigger && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Last Trigger:</strong> {doorStatus.trigger}
                  </p>
                </div>
              )}

              <DoorControl
                doorStatus={doorStatus}
                onControlDoor={onControlDoor}
                isConnected={isConnected}
              />
            </div>

            <SensorDisplay
              sensorData={sensorData}
            />
          </div>

          <div className="space-y-6">
            <AlertSystem />
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>Automatic Door IoT System • Last refresh: {new Date().toLocaleTimeString()}</p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;