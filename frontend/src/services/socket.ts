import { io, Socket } from 'socket.io-client';
import { WebSocketEvents } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Failed to connect to WebSocket server'));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToDoorStatus(): void {
    if (this.socket) {
      this.socket.emit('subscribe:door-status');
    }
  }

  controlDoor(action: 'open' | 'close'): void {
    if (this.socket) {
      this.socket.emit('door:control', { action });
    }
  }

  acknowledgeAlert(alertId: number): void {
    if (this.socket) {
      this.socket.emit('alert:acknowledge', { alertId });
    }
  }

  on<K extends keyof WebSocketEvents>(
    event: K,
    callback: (data: WebSocketEvents[K]) => void
  ): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off<K extends keyof WebSocketEvents>(
    event: K,
    callback: (data: WebSocketEvents[K]) => void
  ): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    if (this.socket.connecting) return 'connecting';
    return 'disconnected';
  }
}

export default new SocketService();