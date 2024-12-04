import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Collapse,
  Box,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Visibility,
  VisibilityOff,
  Lock,
  LockOpen,
  Cube,
  FolderOpen,
} from '@mui/icons-material';
import { useHierarchyStore, SceneNode } from '../../store/hierarchyStore';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const NodeItem: React.FC<{ node: SceneNode; level: number }> = ({ node, level }) => {
  const [
    expandedNodes,
    selectedNodeId,
    toggleNodeExpanded,
    toggleNodeVisibility,
    toggleNodeLocked,
    selectNode,
    nodes,
  ] = useHierarchyStore((state) => [
    state.expandedNodes,
    state.selectedNodeId,
    state.toggleNodeExpanded,
    state.toggleNodeVisibility,
    state.toggleNodeLocked,
    state.selectNode,
    state.nodes,
  ]);

  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <>
      <Draggable draggableId={node.id} index={level}>
        {(provided) => (
          <ListItem
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            sx={{ pl: level * 2 }}
            disablePadding
          >
            <ListItemButton
              selected={selectedNodeId === node.id}
              onClick={() => selectNode(node.id)}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {hasChildren ? (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNodeExpanded(node.id);
                    }}
                  >
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                ) : null}
              </ListItemIcon>
              <ListItemIcon>
                {node.type === 'group' ? <FolderOpen /> : <Cube />}
              </ListItemIcon>
              <ListItemText primary={node.name} />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeVisibility(node.id);
                }}
              >
                {node.visible ? <Visibility /> : <VisibilityOff />}
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeLocked(node.id);
                }}
              >
                {node.locked ? <Lock /> : <LockOpen />}
              </IconButton>
            </ListItemButton>
          </ListItem>
        )}
      </Draggable>
      {hasChildren && isExpanded && (
        <Collapse in={isExpanded}>
          <List disablePadding>
            {node.children.map((childId) => (
              <NodeItem
                key={childId}
                node={nodes[childId]}
                level={level + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const HierarchyPanel: React.FC = () => {
  const [nodes, moveNode] = useHierarchyStore((state) => [
    state.nodes,
    state.moveNode,
  ]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceId = result.draggableId;
    const destinationId = result.destination.droppableId;

    if (sourceId !== destinationId) {
      moveNode(sourceId, destinationId);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        left: 16,
        top: 280,
        width: 300,
        height: 'calc(100vh - 300px)',
        backgroundColor: 'background.paper',
        overflow: 'auto',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Hierarchy</Typography>
      </Box>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="hierarchy">
          {(provided) => (
            <List
              ref={provided.innerRef}
              {...provided.droppableProps}
              disablePadding
            >
              <NodeItem node={nodes.root} level={0} />
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>
    </Paper>
  );
};

export default HierarchyPanel;
