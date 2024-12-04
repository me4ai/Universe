import { useEffect } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { useHierarchyStore } from '../store/hierarchyStore';

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

const createShortcuts = (): ShortcutAction[] => {
  const sceneStore = useSceneStore.getState();
  const hierarchyStore = useHierarchyStore.getState();

  return [
    {
      key: 'z',
      ctrl: true,
      action: () => sceneStore.undo(),
      description: 'Undo',
    },
    {
      key: 'y',
      ctrl: true,
      action: () => sceneStore.redo(),
      description: 'Redo',
    },
    {
      key: 'Delete',
      action: () => {
        const selectedId = sceneStore.selectedShapeId;
        if (selectedId) {
          sceneStore.removeShape(selectedId);
        }
      },
      description: 'Delete selected object',
    },
    {
      key: 'h',
      action: () => {
        const selectedId = hierarchyStore.selectedNodeId;
        if (selectedId) {
          hierarchyStore.toggleNodeVisibility(selectedId);
        }
      },
      description: 'Toggle visibility',
    },
    {
      key: 'l',
      action: () => {
        const selectedId = hierarchyStore.selectedNodeId;
        if (selectedId) {
          hierarchyStore.toggleNodeLocked(selectedId);
        }
      },
      description: 'Toggle lock',
    },
    {
      key: 's',
      ctrl: true,
      action: () => sceneStore.saveScene(),
      description: 'Save scene',
    },
    {
      key: 'g',
      action: () => {
        const selectedId = hierarchyStore.selectedNodeId;
        if (selectedId) {
          hierarchyStore.addNode({
            id: Math.random().toString(36).substr(2, 9),
            name: 'New Group',
            type: 'group',
            parentId: selectedId,
            visible: true,
            locked: false,
          });
        }
      },
      description: 'Create group',
    },
    {
      key: 'f',
      action: () => {
        // Frame selected object
        // TODO: Implement camera framing
      },
      description: 'Frame selected',
    },
    {
      key: 'a',
      ctrl: true,
      action: () => {
        // Select all objects in current group
        // TODO: Implement multi-selection
      },
      description: 'Select all',
    },
    {
      key: 'd',
      ctrl: true,
      action: () => {
        // Duplicate selected object
        // TODO: Implement object duplication
      },
      description: 'Duplicate',
    },
  ];
};

export const useShortcuts = () => {
  useEffect(() => {
    const shortcuts = createShortcuts();
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find(
        (s) =>
          s.key.toLowerCase() === event.key.toLowerCase() &&
          !!s.ctrl === event.ctrlKey &&
          !!s.shift === event.shiftKey &&
          !!s.alt === event.altKey
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};

export const getShortcutsList = (): { key: string; description: string }[] => {
  return createShortcuts().map((shortcut) => {
    const keys: string[] = [];
    if (shortcut.ctrl) keys.push('Ctrl');
    if (shortcut.shift) keys.push('Shift');
    if (shortcut.alt) keys.push('Alt');
    keys.push(shortcut.key);

    return {
      key: keys.join('+'),
      description: shortcut.description,
    };
  });
};
