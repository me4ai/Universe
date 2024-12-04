import React from 'react';
import { Paper, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Cube, Sphere, Cylinder } from '@mui/icons-material';

const ToolPanel: React.FC = () => {
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
        <ListItem button>
          <ListItemIcon>
            <Cube />
          </ListItemIcon>
          <ListItemText primary="Cube" />
        </ListItem>
        <Divider />
        <ListItem button>
          <ListItemIcon>
            <Sphere />
          </ListItemIcon>
          <ListItemText primary="Sphere" />
        </ListItem>
        <Divider />
        <ListItem button>
          <ListItemIcon>
            <Cylinder />
          </ListItemIcon>
          <ListItemText primary="Cylinder" />
        </ListItem>
      </List>
    </Paper>
  );
};

export default ToolPanel;
