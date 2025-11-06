export interface DoorStatus {
  status: 'open' | 'closed';
  timestamp: string;
  autoCloseTimer: number;
  trigger?: 'manual' | 'automatic' | 'timeout';
}

export interface SensorData {
  distance: number;
  timestamp: string;
  threshold: number;
}

export interface Alert {
  id: number;
  type: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  acknowledged: boolean;
  expires_at?: string;
}

export interface DoorLog {
  id: number;
  action: string;
  sensor_distance?: number;
  trigger_type?: string;
  timestamp: string;
  user_id?: string;
}

export interface SystemStats {
  door: {
    total_operations: number;
    open_count: number;
    close_count: number;
    automatic_count: number;
    last_activity: string;
  };
  alerts: {
    total_alerts: number;
    unacknowledged: number;
    high_priority: number;
  };
  system: {
    uptime: number;
    sensorActive: boolean;
    currentThreshold: number;
  };
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WebSocketEvents {
  'door:status-update': DoorStatus;
  'sensor:distance-update': SensorData;
  'alert:new': Alert;
  'system:status': { status: string; timestamp: string };
  'alert:acknowledged': { alertId: number };
  error: { message: string };
}