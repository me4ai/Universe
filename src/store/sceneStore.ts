import create from 'zustand';
import { Material } from './materialStore';

interface Shape {
  id: string;
  type: 'box' | 'sphere' | 'cylinder';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  materialId: string;
}

interface SceneState {
  shapes: Shape[];
  selectedShapeId: string | null;
  history: Shape[][];
  currentHistoryIndex: number;
  addShape: (type: Shape['type'], materialId: string) => void;
  removeShape: (id: string) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  selectShape: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  saveScene: () => void;
  loadScene: (shapes: Shape[]) => void;
}

const MAX_HISTORY = 50;

export const useSceneStore = create<SceneState>((set, get) => ({
  shapes: [],
  selectedShapeId: null,
  history: [[]],
  currentHistoryIndex: 0,

  addShape: (type, materialId) => {
    const newShape: Shape = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      materialId,
    };

    set((state) => {
      const newShapes = [...state.shapes, newShape];
      const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
      newHistory.push(newShapes);
      
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      return {
        shapes: newShapes,
        history: newHistory,
        currentHistoryIndex: newHistory.length - 1,
      };
    });
  },

  removeShape: (id) => {
    set((state) => {
      const newShapes = state.shapes.filter((shape) => shape.id !== id);
      const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
      newHistory.push(newShapes);

      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      return {
        shapes: newShapes,
        selectedShapeId: state.selectedShapeId === id ? null : state.selectedShapeId,
        history: newHistory,
        currentHistoryIndex: newHistory.length - 1,
      };
    });
  },

  updateShape: (id, updates) => {
    set((state) => {
      const newShapes = state.shapes.map((shape) =>
        shape.id === id ? { ...shape, ...updates } : shape
      );
      const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
      newHistory.push(newShapes);

      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      return {
        shapes: newShapes,
        history: newHistory,
        currentHistoryIndex: newHistory.length - 1,
      };
    });
  },

  selectShape: (id) => {
    set({ selectedShapeId: id });
  },

  undo: () => {
    set((state) => {
      if (state.currentHistoryIndex > 0) {
        return {
          shapes: state.history[state.currentHistoryIndex - 1],
          currentHistoryIndex: state.currentHistoryIndex - 1,
        };
      }
      return state;
    });
  },

  redo: () => {
    set((state) => {
      if (state.currentHistoryIndex < state.history.length - 1) {
        return {
          shapes: state.history[state.currentHistoryIndex + 1],
          currentHistoryIndex: state.currentHistoryIndex + 1,
        };
      }
      return state;
    });
  },

  saveScene: () => {
    const state = get();
    const sceneData = JSON.stringify(state.shapes);
    localStorage.setItem('universe_scene', sceneData);
  },

  loadScene: (shapes) => {
    set((state) => {
      const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
      newHistory.push(shapes);

      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      return {
        shapes,
        history: newHistory,
        currentHistoryIndex: newHistory.length - 1,
      };
    });
  },
}));
