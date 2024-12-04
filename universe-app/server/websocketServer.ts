import WebSocket from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiter } from 'limiter';

interface Room {
  id: string;
  users: Map<string, WebSocket>;
  operations: any[];
  lastActivity: number;
}

interface Message {
  type: string;
  payload: any;
  userId?: string;
  timestamp: number;
}

class CollaborationServer {
  private server: http.Server;
  private wss: WebSocket.Server;
  private rooms: Map<string, Room>;
  private rateLimiters: Map<string, RateLimiter>;
  private readonly RATE_LIMIT = 100; // messages per minute
  private readonly ROOM_TIMEOUT = 1000 * 60 * 60; // 1 hour
  private readonly MAX_OPERATIONS = 1000;

  constructor(port: number) {
    this.server = http.createServer();
    this.wss = new WebSocket.Server({ server: this.server });
    this.rooms = new Map();
    this.rateLimiters = new Map();

    this.setupWebSocketServer();
    this.startMaintenanceInterval();

    this.server.listen(port, () => {
      console.log(`WebSocket server is running on port ${port}`);
    });
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      const userId = uuidv4();
      const roomId = this.getRoomIdFromUrl(req.url);
      
      if (!roomId) {
        ws.close(1002, 'Room ID is required');
        return;
      }

      // Create rate limiter for new user
      this.rateLimiters.set(userId, new RateLimiter({
        tokensPerInterval: this.RATE_LIMIT,
        interval: 'minute',
      }));

      // Join or create room
      const room = this.getOrCreateRoom(roomId);
      room.users.set(userId, ws);
      room.lastActivity = Date.now();

      // Send initial state
      this.sendInitialState(ws, room);

      // Handle messages
      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message: Message = JSON.parse(data.toString());
          
          // Rate limiting
          const limiter = this.rateLimiters.get(userId);
          if (!limiter || !(await limiter.tryRemoveTokens(1))) {
            this.sendError(ws, 'Rate limit exceeded');
            return;
          }

          // Process message
          this.handleMessage(message, room, userId, ws);
        } catch (error) {
          console.error('Error processing message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(room, userId);
      });

      // Send join notification
      this.broadcastToRoom(room, {
        type: 'user_joined',
        payload: { userId },
        timestamp: Date.now(),
      }, userId);
    });
  }

  private getRoomIdFromUrl(url: string | undefined): string | null {
    if (!url) return null;
    const match = url.match(/\/room\/([^\/]+)/);
    return match ? match[1] : null;
  }

  private getOrCreateRoom(roomId: string): Room {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        operations: [],
        lastActivity: Date.now(),
      });
    }
    return this.rooms.get(roomId)!;
  }

  private sendInitialState(ws: WebSocket, room: Room) {
    ws.send(JSON.stringify({
      type: 'initial_state',
      payload: {
        operations: room.operations,
        userCount: room.users.size,
      },
      timestamp: Date.now(),
    }));
  }

  private handleMessage(message: Message, room: Room, userId: string, ws: WebSocket) {
    room.lastActivity = Date.now();
    message.userId = userId;

    switch (message.type) {
      case 'scene_operation':
        this.handleSceneOperation(message, room);
        break;

      case 'cursor_update':
      case 'selection_update':
      case 'camera_update':
        this.broadcastToRoom(room, message, userId);
        break;

      case 'chat_message':
        this.validateAndBroadcastChat(message, room, userId);
        break;

      case 'undo_operation':
      case 'redo_operation':
        this.handleHistoryOperation(message, room);
        break;

      case 'heartbeat':
        ws.send(JSON.stringify({
          type: 'heartbeat_ack',
          timestamp: Date.now(),
        }));
        break;

      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private handleSceneOperation(message: Message, room: Room) {
    // Add operation to room history
    room.operations.push(message.payload);
    if (room.operations.length > this.MAX_OPERATIONS) {
      room.operations.shift();
    }

    // Broadcast to all users in room
    this.broadcastToRoom(room, message);
  }

  private validateAndBroadcastChat(message: Message, room: Room, userId: string) {
    const content = message.payload?.content;
    if (typeof content !== 'string' || content.length > 1000) {
      return;
    }

    this.broadcastToRoom(room, {
      type: 'chat_message',
      payload: {
        content: content.trim(),
        userId,
      },
      timestamp: Date.now(),
    });
  }

  private handleHistoryOperation(message: Message, room: Room) {
    // Validate operation
    const operationId = message.payload?.operationId;
    if (!operationId) return;

    // Broadcast to all users
    this.broadcastToRoom(room, message);
  }

  private handleDisconnection(room: Room, userId: string) {
    // Remove user from room
    room.users.delete(userId);
    this.rateLimiters.delete(userId);

    // Broadcast user left message
    this.broadcastToRoom(room, {
      type: 'user_left',
      payload: { userId },
      timestamp: Date.now(),
    });

    // Clean up empty room
    if (room.users.size === 0) {
      this.rooms.delete(room.id);
    }
  }

  private broadcastToRoom(room: Room, message: Message, excludeUserId?: string) {
    const messageStr = JSON.stringify(message);
    room.users.forEach((ws, userId) => {
      if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  private sendError(ws: WebSocket, message: string) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message },
      timestamp: Date.now(),
    }));
  }

  private startMaintenanceInterval() {
    setInterval(() => {
      const now = Date.now();
      this.rooms.forEach((room, roomId) => {
        // Remove inactive rooms
        if (now - room.lastActivity > this.ROOM_TIMEOUT) {
          room.users.forEach((ws) => {
            ws.close(1000, 'Room inactive');
          });
          this.rooms.delete(roomId);
        }
      });
    }, 1000 * 60 * 15); // Run every 15 minutes
  }
}

// Start the server
const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
new CollaborationServer(port);
