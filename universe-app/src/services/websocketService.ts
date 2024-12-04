import { useCollaborationStore } from '../store/collaborationStore';

class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Replace with your actual WebSocket server URL
        this.socket = new WebSocket(`wss://your-websocket-server.com/room/${roomId}`);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.startHeartbeat();
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onmessage = this.handleMessage;
        this.socket.onclose = this.handleClose;
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: 'heartbeat',
        timestamp: Date.now(),
      });
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      const store = useCollaborationStore.getState();

      switch (data.type) {
        case 'user_joined':
          store.sendSystemMessage(`${data.user.name} joined the room`);
          break;

        case 'user_left':
          store.sendSystemMessage(`${data.user.name} left the room`);
          break;

        case 'cursor_update':
          store.updateUserCursor(data.userId, data.x, data.y);
          break;

        case 'selection_update':
          store.updateUserSelection(data.userId, data.selectionId);
          break;

        case 'camera_update':
          store.updateUserCamera(data.userId, data.position, data.target);
          break;

        case 'chat_message':
          store.sendMessage(data.content);
          break;

        case 'scene_operation':
          store.applyOperation(data.operation);
          break;

        case 'presence_update':
          // Handle user presence updates
          break;

        case 'error':
          console.error('Server error:', data.message);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };

  private handleClose = async (event: CloseEvent) => {
    console.log('WebSocket closed:', event.code, event.reason);
    this.stopHeartbeat();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect in ${delay}ms...`);
      
      setTimeout(async () => {
        try {
          const store = useCollaborationStore.getState();
          if (store.roomId) {
            await this.connect(store.roomId);
          }
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      const store = useCollaborationStore.getState();
      store.disconnect();
    }
  };

  send(data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.close();
      this.socket = null;
    }
  }

  // Specific message senders
  sendCursorUpdate(x: number, y: number) {
    this.send({
      type: 'cursor_update',
      x,
      y,
      timestamp: Date.now(),
    });
  }

  sendSelectionUpdate(selectionId: string | null) {
    this.send({
      type: 'selection_update',
      selectionId,
      timestamp: Date.now(),
    });
  }

  sendCameraUpdate(position: [number, number, number], target: [number, number, number]) {
    this.send({
      type: 'camera_update',
      position,
      target,
      timestamp: Date.now(),
    });
  }

  sendChatMessage(content: string) {
    this.send({
      type: 'chat_message',
      content,
      timestamp: Date.now(),
    });
  }

  sendSceneOperation(operation: any) {
    this.send({
      type: 'scene_operation',
      operation,
      timestamp: Date.now(),
    });
  }

  sendPresenceUpdate() {
    this.send({
      type: 'presence_update',
      timestamp: Date.now(),
    });
  }
}

export const websocketService = WebSocketService.getInstance();
