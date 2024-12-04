import create from 'zustand';
import { useSceneStore } from './sceneStore';
import { useHierarchyStore } from './hierarchyStore';
import { useAdvancedMaterialStore } from './advancedMaterialStore';

export interface User {
  id: string;
  name: string;
  color: string;
  cursor: {
    x: number;
    y: number;
  };
  selection: string | null;
  viewportCamera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  lastActive: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system' | 'action';
}

export interface SceneOperation {
  id: string;
  userId: string;
  timestamp: number;
  type: 'add' | 'update' | 'delete' | 'transform';
  target: {
    type: 'shape' | 'material' | 'hierarchy';
    id: string;
  };
  data: any;
}

interface CollaborationState {
  connected: boolean;
  roomId: string | null;
  users: { [key: string]: User };
  currentUserId: string | null;
  messages: ChatMessage[];
  operations: SceneOperation[];
  
  // Connection management
  connect: (roomId: string, userName: string) => Promise<void>;
  disconnect: () => void;
  
  // User management
  updateUserCursor: (userId: string, x: number, y: number) => void;
  updateUserSelection: (userId: string, selectionId: string | null) => void;
  updateUserCamera: (
    userId: string,
    position: [number, number, number],
    target: [number, number, number]
  ) => void;
  
  // Chat operations
  sendMessage: (content: string) => void;
  sendSystemMessage: (content: string) => void;
  
  // Scene synchronization
  broadcastOperation: (operation: Omit<SceneOperation, 'id' | 'userId' | 'timestamp'>) => void;
  applyOperation: (operation: SceneOperation) => void;
  
  // Presence management
  updatePresence: () => void;
  cleanupInactiveUsers: () => void;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  connected: false,
  roomId: null,
  users: {},
  currentUserId: null,
  messages: [],
  operations: [],

  connect: async (roomId, userName) => {
    // Implement WebSocket connection here
    const userId = Math.random().toString(36).substr(2, 9);
    const userColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;

    set({
      connected: true,
      roomId,
      currentUserId: userId,
      users: {
        [userId]: {
          id: userId,
          name: userName,
          color: userColor,
          cursor: { x: 0, y: 0 },
          selection: null,
          viewportCamera: {
            position: [5, 5, 5],
            target: [0, 0, 0],
          },
          lastActive: Date.now(),
        },
      },
    });

    // Broadcast join message
    get().sendSystemMessage(`${userName} joined the room`);
  },

  disconnect: () => {
    const { currentUserId, users } = get();
    if (currentUserId) {
      const userName = users[currentUserId]?.name;
      get().sendSystemMessage(`${userName} left the room`);
    }

    set({
      connected: false,
      roomId: null,
      currentUserId: null,
      users: {},
      messages: [],
      operations: [],
    });
  },

  updateUserCursor: (userId, x, y) => {
    set((state) => ({
      users: {
        ...state.users,
        [userId]: {
          ...state.users[userId],
          cursor: { x, y },
          lastActive: Date.now(),
        },
      },
    }));
  },

  updateUserSelection: (userId, selectionId) => {
    set((state) => ({
      users: {
        ...state.users,
        [userId]: {
          ...state.users[userId],
          selection: selectionId,
          lastActive: Date.now(),
        },
      },
    }));
  },

  updateUserCamera: (userId, position, target) => {
    set((state) => ({
      users: {
        ...state.users,
        [userId]: {
          ...state.users[userId],
          viewportCamera: { position, target },
          lastActive: Date.now(),
        },
      },
    }));
  },

  sendMessage: (content) => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    const message: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUserId,
      content,
      timestamp: Date.now(),
      type: 'text',
    };

    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  sendSystemMessage: (content) => {
    const message: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      userId: 'system',
      content,
      timestamp: Date.now(),
      type: 'system',
    };

    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  broadcastOperation: (operation) => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    const fullOperation: SceneOperation = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUserId,
      timestamp: Date.now(),
      ...operation,
    };

    set((state) => ({
      operations: [...state.operations, fullOperation],
    }));

    // Apply operation locally
    get().applyOperation(fullOperation);
  },

  applyOperation: (operation) => {
    const sceneStore = useSceneStore.getState();
    const hierarchyStore = useHierarchyStore.getState();
    const materialStore = useAdvancedMaterialStore.getState();

    switch (operation.target.type) {
      case 'shape':
        switch (operation.type) {
          case 'add':
            sceneStore.addShape(operation.data);
            break;
          case 'update':
            sceneStore.updateShape(operation.target.id, operation.data);
            break;
          case 'delete':
            sceneStore.removeShape(operation.target.id);
            break;
          case 'transform':
            sceneStore.updateShape(operation.target.id, operation.data);
            break;
        }
        break;

      case 'material':
        switch (operation.type) {
          case 'add':
            materialStore.addMaterial(operation.data);
            break;
          case 'update':
            materialStore.updateMaterial(operation.target.id, operation.data);
            break;
          case 'delete':
            materialStore.removeMaterial(operation.target.id);
            break;
        }
        break;

      case 'hierarchy':
        switch (operation.type) {
          case 'add':
            hierarchyStore.addNode(operation.data);
            break;
          case 'update':
            hierarchyStore.updateNode(operation.target.id, operation.data);
            break;
          case 'delete':
            hierarchyStore.removeNode(operation.target.id);
            break;
        }
        break;
    }
  },

  updatePresence: () => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    set((state) => ({
      users: {
        ...state.users,
        [currentUserId]: {
          ...state.users[currentUserId],
          lastActive: Date.now(),
        },
      },
    }));
  },

  cleanupInactiveUsers: () => {
    const now = Date.now();
    const inactiveThreshold = 30000; // 30 seconds

    set((state) => {
      const activeUsers = { ...state.users };
      let changed = false;

      Object.entries(activeUsers).forEach(([userId, user]) => {
        if (now - user.lastActive > inactiveThreshold) {
          delete activeUsers[userId];
          changed = true;
        }
      });

      return changed ? { users: activeUsers } : state;
    });
  },
}));
