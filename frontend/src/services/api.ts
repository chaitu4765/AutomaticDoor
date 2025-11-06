import { DoorStatus, Alert, SystemStats, DoorLog, Setting, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data.data as T;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  async getDoorStatus(): Promise<DoorStatus> {
    return this.request<DoorStatus>('/door/status');
  }

  async controlDoor(action: 'open' | 'close'): Promise<DoorStatus> {
    return this.request<DoorStatus>('/door/control', {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  async getAlerts(page: number = 1, limit: number = 20, type?: string, acknowledged?: boolean): Promise<{
    alerts: Alert[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) params.append('type', type);
    if (acknowledged !== undefined) params.append('acknowledged', acknowledged.toString());

    return this.request(`/alerts?${params}`);
  }

  async acknowledgeAlert(alertId: number): Promise<void> {
    return this.request(`/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    });
  }

  async getSystemStats(): Promise<SystemStats> {
    return this.request<SystemStats>('/stats');
  }

  async getDoorLogs(limit: number = 50): Promise<DoorLog[]> {
    return this.request<DoorLog[]>(`/logs?limit=${limit}`);
  }

  async getSettings(): Promise<Setting[]> {
    return this.request<Setting[]>('/settings');
  }

  async updateSetting(key: string, value: string): Promise<void> {
    return this.request(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

  async getSensorDistance(): Promise<{
    distance: number;
    timestamp: string;
    threshold: number;
  }> {
    return this.request('/sensor/distance');
  }
}

export default new ApiService();