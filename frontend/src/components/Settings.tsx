import React, { useState, useEffect } from 'react';
import { Setting } from '../types';
import apiService from '../services/api';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSettings();
      setSettings(data);
      setError(null);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: string, value: string) => {
    try {
      setSaving(true);
      await apiService.updateSetting(key, value);

      setSettings(prev => prev.map(setting =>
        setting.key === key ? { ...setting, value } : setting
      ));

      setError(null);
    } catch (error) {
      console.error('Failed to update setting:', error);
      setError('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting: Setting) => {
    const { key, value, description } = setting;

    switch (key) {
      case 'detection_threshold':
        return (
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="50"
              max="400"
              value={parseInt(value)}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className="flex-1"
              disabled={saving}
            />
            <span className="text-sm font-medium text-gray-900 w-16 text-right">
              {value} cm
            </span>
          </div>
        );

      case 'auto_close_timer':
        return (
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={parseInt(value)}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className="flex-1"
              disabled={saving}
            />
            <span className="text-sm font-medium text-gray-900 w-16 text-right">
              {value}s
            </span>
          </div>
        );

      case 'sensor_update_interval':
        return (
          <div className="flex items-center space-x-4">
            <select
              value={parseInt(value)}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={saving}
            >
              <option value="100">100ms (Very Fast)</option>
              <option value="250">250ms (Fast)</option>
              <option value="500">500ms (Normal)</option>
              <option value="1000">1000ms (Slow)</option>
              <option value="2000">2000ms (Very Slow)</option>
            </select>
          </div>
        );

      case 'alert_sound_enabled':
      case 'notifications_enabled':
        return (
          <div className="flex items-center">
            <button
              onClick={() => handleSettingChange(key, value === 'true' ? 'false' : 'true')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value === 'true' ? 'bg-primary-500' : 'bg-gray-200'
              }`}
              disabled={saving}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="ml-3 text-sm font-medium text-gray-900">
              {value === 'true' ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleSettingChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={saving}
          />
        );
    }
  };

  const getSettingTitle = (key: string) => {
    switch (key) {
      case 'detection_threshold':
        return 'Detection Threshold';
      case 'auto_close_timer':
        return 'Auto-Close Timer';
      case 'alert_sound_enabled':
        return 'Alert Sound';
      case 'notifications_enabled':
        return 'Browser Notifications';
      case 'sensor_update_interval':
        return 'Sensor Update Interval';
      default:
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getSettingDescription = (key: string, description?: string) => {
    if (description) return description;

    switch (key) {
      case 'detection_threshold':
        return 'Maximum distance at which the sensor detects objects';
      case 'auto_close_timer':
        return 'Time in seconds before door automatically closes';
      case 'alert_sound_enabled':
        return 'Play sound when new alerts are generated';
      case 'notifications_enabled':
        return 'Show browser notifications for alerts';
      case 'sensor_update_interval':
        return 'How often the sensor readings are updated';
      default:
        return 'System configuration setting';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        {saving && (
          <div className="flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Saving...
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {settings.map((setting) => (
          <div key={setting.key} className="border-b border-gray-100 pb-6 last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {getSettingTitle(setting.key)}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {getSettingDescription(setting.key, setting.description)}
                </p>
              </div>
            </div>

            <div className="mt-3">
              {renderSettingInput(setting)}
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Last updated: {new Date(setting.updated_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 text-lg">💡</span>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Settings Tips</h4>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Detection range determines when the door opens automatically</li>
              <li>• Auto-close timer prevents the door from staying open indefinitely</li>
              <li>• Sensor update interval affects system responsiveness and resource usage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;