import create from 'zustand';

export interface SceneNode {
  id: string;
  name: string;
  type: 'group' | 'shape';
  parentId: string | null;
  children: string[];
  visible: boolean;
  locked: boolean;
}

interface HierarchyState {
  nodes: { [key: string]: SceneNode };
  selectedNodeId: string | null;
  expandedNodes: Set<string>;
  
  // Node operations
  addNode: (node: Omit<SceneNode, 'children'>) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<SceneNode>) => void;
  selectNode: (id: string | null) => void;
  
  // Hierarchy operations
  addChild: (parentId: string, childId: string) => void;
  removeChild: (parentId: string, childId: string) => void;
  moveNode: (nodeId: string, newParentId: string | null) => void;
  
  // View operations
  toggleNodeExpanded: (id: string) => void;
  toggleNodeVisibility: (id: string) => void;
  toggleNodeLocked: (id: string) => void;
}

export const useHierarchyStore = create<HierarchyState>((set, get) => ({
  nodes: {
    root: {
      id: 'root',
      name: 'Scene',
      type: 'group',
      parentId: null,
      children: [],
      visible: true,
      locked: false,
    },
  },
  selectedNodeId: null,
  expandedNodes: new Set(['root']),

  addNode: (node) => {
    set((state) => ({
      nodes: {
        ...state.nodes,
        [node.id]: {
          ...node,
          children: [],
        },
      },
    }));

    if (node.parentId) {
      get().addChild(node.parentId, node.id);
    }
  },

  removeNode: (id) => {
    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;

      // Remove from parent's children
      if (node.parentId && state.nodes[node.parentId]) {
        const parent = state.nodes[node.parentId];
        const updatedParent = {
          ...parent,
          children: parent.children.filter((childId) => childId !== id),
        };
        state.nodes[node.parentId] = updatedParent;
      }

      // Remove all children recursively
      const removeChildren = (nodeId: string) => {
        const currentNode = state.nodes[nodeId];
        if (!currentNode) return;

        currentNode.children.forEach((childId) => {
          removeChildren(childId);
          delete state.nodes[childId];
        });
      };
      removeChildren(id);

      // Remove the node itself
      const { [id]: removed, ...remainingNodes } = state.nodes;
      return {
        nodes: remainingNodes,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      };
    });
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: {
          ...state.nodes[id],
          ...updates,
        },
      },
    }));
  },

  selectNode: (id) => {
    set({ selectedNodeId: id });
  },

  addChild: (parentId, childId) => {
    set((state) => {
      const parent = state.nodes[parentId];
      if (!parent) return state;

      return {
        nodes: {
          ...state.nodes,
          [parentId]: {
            ...parent,
            children: [...parent.children, childId],
          },
        },
      };
    });
  },

  removeChild: (parentId, childId) => {
    set((state) => {
      const parent = state.nodes[parentId];
      if (!parent) return state;

      return {
        nodes: {
          ...state.nodes,
          [parentId]: {
            ...parent,
            children: parent.children.filter((id) => id !== childId),
          },
        },
      };
    });
  },

  moveNode: (nodeId, newParentId) => {
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;

      // Remove from old parent
      if (node.parentId && state.nodes[node.parentId]) {
        const oldParent = state.nodes[node.parentId];
        state.nodes[node.parentId] = {
          ...oldParent,
          children: oldParent.children.filter((id) => id !== nodeId),
        };
      }

      // Add to new parent
      if (newParentId && state.nodes[newParentId]) {
        const newParent = state.nodes[newParentId];
        state.nodes[newParentId] = {
          ...newParent,
          children: [...newParent.children, nodeId],
        };
      }

      // Update node's parent
      state.nodes[nodeId] = {
        ...node,
        parentId: newParentId,
      };

      return { nodes: state.nodes };
    });
  },

  toggleNodeExpanded: (id) => {
    set((state) => {
      const newExpanded = new Set(state.expandedNodes);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { expandedNodes: newExpanded };
    });
  },

  toggleNodeVisibility: (id) => {
    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;

      const toggleChildren = (nodeId: string) => {
        const currentNode = state.nodes[nodeId];
        if (!currentNode) return;

        state.nodes[nodeId] = {
          ...currentNode,
          visible: !node.visible,
        };

        currentNode.children.forEach(toggleChildren);
      };

      toggleChildren(id);
      return { nodes: { ...state.nodes } };
    });
  },

  toggleNodeLocked: (id) => {
    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;

      const toggleChildren = (nodeId: string) => {
        const currentNode = state.nodes[nodeId];
        if (!currentNode) return;

        state.nodes[nodeId] = {
          ...currentNode,
          locked: !node.locked,
        };

        currentNode.children.forEach(toggleChildren);
      };

      toggleChildren(id);
      return { nodes: { ...state.nodes } };
    });
  },
}));
