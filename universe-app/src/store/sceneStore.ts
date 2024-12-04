import create from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { useHierarchyStore } from './hierarchyStore';

export interface Shape {
  id: string;
  type: 'box' | 'sphere' | 'cylinder';
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  materialId: string | null;
}

interface SceneState {
  shapes: { [key: string]: Shape };
  selectedShapeId: string | null;
  history: Array<{ shapes: { [key: string]: Shape } }>;
  currentHistoryIndex: number;
  
  addShape: (shape: Omit<Shape, 'id'>) => void;
  removeShape: (id: string) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  selectShape: (id: string | null) => void;
  
  undo: () => void;
  redo: () => void;
  
  saveScene: () => void;
  loadScene: (data: any) => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  shapes: {},
  selectedShapeId: null,
  history: [{ shapes: {} }],
  currentHistoryIndex: 0,

  addShape: (shape) => {
    const id = uuidv4();
    const newShape = { ...shape, id };

    // Add to scene store
    set((state) => {
      const newShapes = {
        ...state.shapes,
        [id]: newShape,
      };

      // Add to history
      const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
      newHistory.push({ shapes: newShapes });

      return {
        shapes: newShapes,
        history: newHistory,
        currentHistoryIndex: state.currentHistoryIndex + 1,
      };
    });

    // Add to hierarchy
    useHierarchyStore.getState().addNode({
      id,
      name: shape.name,
      type: 'shape',
      parentId: 'root',
      visible: true,
      locked: false,
    });
  },

  removeShape: (id) => {
    set((state) => {
      const { [id]: removed, ...remainingShapes } = state.shapes;

      // Add to history
      const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
      newHistory.push({ shapes: remainingShapes });

      return {
        shapes: remainingShapes,
        selectedShapeId: state.selectedShapeId === id ? null : state.selectedShapeId,
        history: newHistory,
        currentHistoryIndex: state.currentHistoryIndex + 1,
      };
    });

    // Remove from hierarchy
    useHierarchyStore.getState().removeNode(id);
  },

  updateShape: (id, updates) => {
    set((state) => {
      const newShapes = {
        ...state.shapes,
        [id]: {
          ...state.shapes[id],
          ...updates,
        },
      };

      // Add to history
      const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
      newHistory.push({ shapes: newShapes });

      return {
        shapes: newShapes,
        history: newHistory,
        currentHistoryIndex: state.currentHistoryIndex + 1,
      };
    });

    // Update hierarchy if name changed
    if (updates.name) {
      useHierarchyStore.getState().updateNode(id, { name: updates.name });
    }
  },

  selectShape: (id) => {
    set({ selectedShapeId: id });
    useHierarchyStore.getState().selectNode(id);
  },

  undo: () => {
    set((state) => {
      if (state.currentHistoryIndex > 0) {
        const newIndex = state.currentHistoryIndex - 1;
        return {
          shapes: state.history[newIndex].shapes,
          currentHistoryIndex: newIndex,
        };
      }
      return state;
    });
  },

  redo: () => {
    set((state) => {
      if (state.currentHistoryIndex < state.history.length - 1) {
        const newIndex = state.currentHistoryIndex + 1;
        return {
          shapes: state.history[newIndex].shapes,
          currentHistoryIndex: newIndex,
        };
      }
      return state;
    });
  },

  saveScene: () => {
    const state = get();
    const hierarchyState = useHierarchyStore.getState();
    
    const sceneData = {
      shapes: state.shapes,
      hierarchy: {
        nodes: hierarchyState.nodes,
        expandedNodes: Array.from(hierarchyState.expandedNodes),
      },
    };

    localStorage.setItem('scene', JSON.stringify(sceneData));
  },

  loadScene: (data) => {
    if (!data) return;

    // Load shapes
    set({
      shapes: data.shapes || {},
      history: [{ shapes: data.shapes || {} }],
      currentHistoryIndex: 0,
    });

    // Load hierarchy
    if (data.hierarchy) {
      const hierarchyStore = useHierarchyStore.getState();
      Object.values(data.hierarchy.nodes).forEach((node: any) => {
        if (node.id !== 'root') {
          hierarchyStore.addNode(node);
        }
      });
      
      hierarchyStore.expandedNodes = new Set(data.hierarchy.expandedNodes);
    }
  },
}));
