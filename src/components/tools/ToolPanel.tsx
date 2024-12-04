import React from 'react';
import { Paper, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { useSceneStore } from '../../store/sceneStore';
import CubeIcon from '@mui/icons-material/ViewInAr';
import SphereIcon from '@mui/icons-material/RadioButtonUnchecked';
import CylinderIcon from '@mui/icons-material/Crop169';

const ToolPanel: React.FC = () => {
  const addShape = useSceneStore((state) => state.addShape);

  return (
    <Paper 
      elevation={3}
      sx={{
        position: 'absolute',
        left: 16,
        top: 80,
        width: 200,
        backgroundColor: 'background.paper',
      }}
    >
      <List>
        <ListItem button onClick={() => addShape('box')}>
          <ListItemIcon>
            <CubeIcon />
          </ListItemIcon>
          <ListItemText primary="Cube" />
        </ListItem>
        <Divider />
        <ListItem button onClick={() => addShape('sphere')}>
          <ListItemIcon>
            <SphereIcon />
          </ListItemIcon>
          <ListItemText primary="Sphere" />
        </ListItem>
        <Divider />
        <ListItem button onClick={() => addShape('cylinder')}>
          <ListItemIcon>
            <CylinderIcon />
          </ListItemIcon>
          <ListItemText primary="Cylinder" />
        </ListItem>
      </List>
    </Paper>
  );
};

export default ToolPanel;
