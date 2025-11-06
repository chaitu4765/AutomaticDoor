import React, { useState, useEffect, useRef } from 'react';
import { Alert } from '../types';
import { useSocket } from '../hooks/useSocket';
import apiService from '../services/api';

const AlertSystem: React.FC = () => {
  const { alerts, acknowledgeAlert, isConnected } = useSocket();
  const [filter, setFilter] = useState<'all' | 'unacknowledged'>('all');
  const [showSound, setShowSound] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
    }
  }, []);

  useEffect(() => {
    if (showSound && alerts.length > 0 && audioRef.current) {
      const latestAlert = alerts[0];
      if (!latestAlert.acknowledged) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
    }
  }, [alerts, showSound]);

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await apiService.acknowledgeAlert(alertId);
      acknowledgeAlert(alertId);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleAcknowledgeAll = async () => {
    const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
    for (const alert of unacknowledgedAlerts) {
      await handleAcknowledgeAlert(alert.id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'door_operation':
        return '🚪';
      case 'human_detected':
        return '👤';
      case 'system_error':
        return '⚠️';
      case 'maintenance':
        return '🔧';
      default:
        return '📢';
    }
  };

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(alert => !alert.acknowledged);

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Alerts</h2>
          <div className="flex items-center space-x-2">
            {unacknowledgedCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unacknowledgedCount}
              </span>
            )}
            <button
              onClick={() => setShowSound(!showSound)}
              className={`p-2 rounded-lg ${
                showSound
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
              title={showSound ? 'Sound enabled' : 'Sound disabled'}
            >
              {showSound ? '🔊' : '🔇'}
            </button>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('unacknowledged')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unacknowledged'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Unread ({unacknowledgedCount})
          </button>
          {unacknowledgedCount > 0 && (
            <button
              onClick={handleAcknowledgeAll}
              className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-2">📭</div>
            <p className="text-gray-500">
              {filter === 'unacknowledged' ? 'No unread alerts' : 'No alerts'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 transition-all duration-200 ${
                  !alert.acknowledged
                    ? 'bg-blue-50 border-l-4 border-blue-500 alert-sound'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        !alert.acknowledged ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="ml-2 px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      disabled={!isConnected}
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isConnected && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-800">
            ⚠️ Cannot acknowledge alerts while disconnected
          </p>
        </div>
      )}
    </div>
  );
};

export default AlertSystem;