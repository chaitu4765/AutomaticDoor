import React from 'react';
import { SensorData } from '../types';

interface SensorDisplayProps {
  sensorData: SensorData | null;
}

const SensorDisplay: React.FC<SensorDisplayProps> = ({ sensorData }) => {
  const getDistanceColor = (distance: number, threshold: number) => {
    if (distance < 100) return 'text-green-600 bg-green-50 border-green-200';
    if (distance < threshold) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getDetectionStatus = (distance: number, threshold: number) => {
    if (distance < 100) return { status: 'Human Detected', icon: '👤', color: 'text-green-600' };
    if (distance < threshold) return { status: 'Object Detected', icon: '📦', color: 'text-yellow-600' };
    return { status: 'Clear', icon: '✅', color: 'text-gray-600' };
  };

  const getGaugeRotation = (distance: number, maxDistance: number = 400) => {
    return Math.max(-90, Math.min(90, (1 - distance / maxDistance) * 180 - 90));
  };

  if (!sensorData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sensor Status</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📡</div>
            <p className="text-gray-500">No sensor data available</p>
          </div>
        </div>
      </div>
    );
  }

  const detectionStatus = getDetectionStatus(sensorData.distance, sensorData.threshold);
  const gaugeRotation = getGaugeRotation(sensorData.distance);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sensor Status</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-2 rounded-full border-2 border-gray-100"></div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {sensorData.distance.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">cm</div>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="absolute w-1 h-12 bg-red-500 rounded-full"
                style={{
                  transform: `rotate(${gaugeRotation}deg)`,
                  transformOrigin: 'center bottom',
                  bottom: '50%',
                }}
              ></div>
            </div>

            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
          </div>

          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDistanceColor(sensorData.distance, sensorData.threshold)}`}>
            <div className="flex items-center space-x-1">
              <span>{detectionStatus.icon}</span>
              <span>{detectionStatus.status}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Current Distance</span>
              <span className="text-lg font-semibold text-gray-900">
                {sensorData.distance.toFixed(1)} cm
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  sensorData.distance < 100
                    ? 'bg-green-500'
                    : sensorData.distance < sensorData.threshold
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, (sensorData.distance / 400) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Detection Threshold</span>
              <span className="text-lg font-semibold text-gray-900">
                {sensorData.threshold} cm
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Reading</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(sensorData.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 rounded p-2">
                <div className="text-green-600 text-lg">🟢</div>
                <div className="text-xs text-gray-600">&lt;100cm</div>
                <div className="text-xs font-medium">Human</div>
              </div>
              <div className="bg-yellow-50 rounded p-2">
                <div className="text-yellow-600 text-lg">🟡</div>
                <div className="text-xs text-gray-600">100-200cm</div>
                <div className="text-xs font-medium">Object</div>
              </div>
              <div className="bg-red-50 rounded p-2">
                <div className="text-red-600 text-lg">🔴</div>
                <div className="text-xs text-gray-600">&gt;200cm</div>
                <div className="text-xs font-medium">Clear</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorDisplay;