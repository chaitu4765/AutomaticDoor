import React, { useState } from 'react';
import { DoorStatus } from '../types';

interface DoorControlProps {
  doorStatus: DoorStatus | null;
  onControlDoor: (action: 'open' | 'close') => void;
  isConnected: boolean;
}

const DoorControl: React.FC<DoorControlProps> = ({
  doorStatus,
  onControlDoor,
  isConnected
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDoorControl = async (action: 'open' | 'close') => {
    if (!isConnected || isLoading) return;

    setIsLoading(true);
    try {
      onControlDoor(action);
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const isDoorOpen = doorStatus?.status === 'open';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => handleDoorControl('open')}
          disabled={!isConnected || isDoorOpen || isLoading}
          className={`flex-1 py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
            isDoorOpen
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
          } ${isLoading ? 'opacity-75' : ''}`}
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl">🚪</span>
            <span>{isLoading ? 'Processing...' : 'Open Door'}</span>
          </div>
        </button>

        <button
          onClick={() => handleDoorControl('close')}
          disabled={!isConnected || !isDoorOpen || isLoading}
          className={`flex-1 py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
            !isDoorOpen
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
          } ${isLoading ? 'opacity-75' : ''}`}
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl">🔒</span>
            <span>{isLoading ? 'Processing...' : 'Close Door'}</span>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <h3 className="font-medium text-yellow-800">Safety Notice</h3>
          </div>
          <p className="text-sm text-yellow-700">
            Ensure door area is clear before operation
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-blue-600 text-xl">ℹ️</span>
            <h3 className="font-medium text-blue-800">Auto Mode</h3>
          </div>
          <p className="text-sm text-blue-700">
            Door closes automatically after {doorStatus?.autoCloseTimer || 30}s
          </p>
        </div>
      </div>

      {!isConnected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-600 text-xl">🔴</span>
            <h3 className="font-medium text-red-800">Connection Lost</h3>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Cannot control door while disconnected from the system
          </p>
        </div>
      )}
    </div>
  );
};

export default DoorControl;