import create from 'zustand';
import { useCollaborationStore, SceneOperation } from './collaborationStore';
import { websocketService } from '../services/websocketService';

export interface HistoryState {
  operations: SceneOperation[];
  undoStack: SceneOperation[];
  redoStack: SceneOperation[];
  currentIndex: number;
  maxHistorySize: number;

  // History management
  pushOperation: (operation: SceneOperation) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;

  // Collaboration
  mergeOperation: (operation: SceneOperation) => void;
  rebaseHistory: (baseOperation: SceneOperation) => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  operations: [],
  undoStack: [],
  redoStack: [],
  currentIndex: -1,
  maxHistorySize: 100,

  pushOperation: (operation) => {
    const { operations, currentIndex, maxHistorySize } = get();
    const collaborationStore = useCollaborationStore.getState();

    // Broadcast operation to other users
    websocketService.sendSceneOperation(operation);

    // Add operation to history
    set((state) => {
      const newOperations = [
        ...operations.slice(0, currentIndex + 1),
        operation,
      ].slice(-maxHistorySize);

      return {
        operations: newOperations,
        currentIndex: Math.min(currentIndex + 1, maxHistorySize - 1),
        redoStack: [], // Clear redo stack when new operation is pushed
      };
    });

    // Apply operation
    collaborationStore.applyOperation(operation);
  },

  undo: () => {
    const { operations, currentIndex } = get();
    if (!get().canUndo()) return;

    const collaborationStore = useCollaborationStore.getState();
    const operation = operations[currentIndex];

    // Create and apply inverse operation
    const inverseOperation = createInverseOperation(operation);
    collaborationStore.applyOperation(inverseOperation);

    // Update history state
    set((state) => ({
      currentIndex: state.currentIndex - 1,
      undoStack: [...state.undoStack, operation],
    }));

    // Broadcast undo to other users
    websocketService.send({
      type: 'undo_operation',
      operationId: operation.id,
      timestamp: Date.now(),
    });
  },

  redo: () => {
    const { undoStack } = get();
    if (!get().canRedo()) return;

    const collaborationStore = useCollaborationStore.getState();
    const operation = undoStack[undoStack.length - 1];

    // Apply original operation
    collaborationStore.applyOperation(operation);

    // Update history state
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      undoStack: state.undoStack.slice(0, -1),
    }));

    // Broadcast redo to other users
    websocketService.send({
      type: 'redo_operation',
      operationId: operation.id,
      timestamp: Date.now(),
    });
  },

  canUndo: () => {
    return get().currentIndex >= 0;
  },

  canRedo: () => {
    return get().undoStack.length > 0;
  },

  clear: () => {
    set({
      operations: [],
      undoStack: [],
      redoStack: [],
      currentIndex: -1,
    });
  },

  mergeOperation: (operation) => {
    const { operations, currentIndex, maxHistorySize } = get();
    const collaborationStore = useCollaborationStore.getState();

    // Find the correct position to insert the operation based on timestamp
    let insertIndex = operations.findIndex(
      (op) => op.timestamp > operation.timestamp
    );
    if (insertIndex === -1) insertIndex = operations.length;

    // Insert operation and update history
    set((state) => {
      const newOperations = [
        ...operations.slice(0, insertIndex),
        operation,
        ...operations.slice(insertIndex),
      ].slice(-maxHistorySize);

      return {
        operations: newOperations,
        currentIndex: Math.min(
          insertIndex <= currentIndex ? currentIndex + 1 : currentIndex,
          maxHistorySize - 1
        ),
      };
    });

    // Apply operation if it's not already applied
    if (insertIndex <= currentIndex) {
      collaborationStore.applyOperation(operation);
    }
  },

  rebaseHistory: (baseOperation) => {
    const { operations } = get();
    const collaborationStore = useCollaborationStore.getState();

    // Find conflicting operations
    const conflictingOperations = operations.filter(
      (op) =>
        op.timestamp > baseOperation.timestamp &&
        op.target.id === baseOperation.target.id
    );

    // Remove conflicting operations from history
    set((state) => ({
      operations: operations.filter(
        (op) => !conflictingOperations.includes(op)
      ),
    }));

    // Apply base operation
    collaborationStore.applyOperation(baseOperation);

    // Reapply non-conflicting operations
    conflictingOperations.forEach((operation) => {
      const transformedOperation = transformOperation(
        operation,
        baseOperation
      );
      if (transformedOperation) {
        collaborationStore.applyOperation(transformedOperation);
        get().mergeOperation(transformedOperation);
      }
    });
  },
}));

// Helper functions for operation transformation
function createInverseOperation(operation: SceneOperation): SceneOperation {
  const inverse: SceneOperation = {
    ...operation,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
  };

  switch (operation.type) {
    case 'add':
      inverse.type = 'delete';
      break;
    case 'delete':
      inverse.type = 'add';
      break;
    case 'update':
      // For update operations, we need the previous state
      // This should be stored in the original operation data
      inverse.data = operation.data.previousState;
      break;
    case 'transform':
      // For transform operations, we need to inverse the transformation
      inverse.data = {
        position: operation.data.previousPosition,
        rotation: operation.data.previousRotation,
        scale: operation.data.previousScale,
      };
      break;
  }

  return inverse;
}

function transformOperation(
  operation: SceneOperation,
  baseOperation: SceneOperation
): SceneOperation | null {
  // Implement operational transformation logic here
  // This is a simplified version that just returns the original operation
  // In a real implementation, you would need to handle all possible operation combinations
  return operation;
}
