import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import apiService from './services/api';
import './index.css';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
  const [initialDoorStatus, setInitialDoorStatus] = useState(null);
  const [initialSensorData, setInitialSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    isConnected,
    doorStatus,
    sensorData,
    controlDoor,
    connectionStatus
  } = useSocket();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [doorStatus, sensorData] = await Promise.all([
          apiService.getDoorStatus(),
          apiService.getSensorDistance()
        ]);

        setInitialDoorStatus(doorStatus);
        setInitialSensorData(sensorData);
        setError(null);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setError('Failed to connect to the system. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Browser notifications granted');
        }
      });
    }
  }, []);

  const handleControlDoor = (action: 'open' | 'close') => {
    controlDoor(action);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Door ${action}ed`, {
        body: `The door has been ${action}ed successfully`,
        icon: '/favicon.ico',
        tag: 'door-control'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Automatic Door System
          </h2>
          <p className="text-gray-600">
            Establishing connection to your IoT device...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🚪</span>
                <span className="font-semibold text-gray-900">
                  Automatic Door IoT
                </span>
              </div>
              <div className="hidden md:flex space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('settings')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'settings'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Settings
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus === 'connected'
                  ? 'bg-green-100 text-green-800'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                {connectionStatus === 'connected' ? 'Live' :
                 connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {currentView === 'dashboard' ? (
          <Dashboard
            doorStatus={doorStatus || initialDoorStatus}
            sensorData={sensorData || initialSensorData}
            isConnected={isConnected}
            onControlDoor={handleControlDoor}
          />
        ) : (
          <div className="max-w-4xl mx-auto p-6">
            <Settings />
          </div>
        )}
      </main>

      {connectionStatus === 'disconnected' && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <span className="text-lg">🔴</span>
          <span className="font-medium">Connection Lost</span>
        </div>
      )}
    </div>
  );
};

export default App;