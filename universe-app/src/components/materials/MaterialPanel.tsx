import React, { useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Slider,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useMaterialStore, Material } from '../../store/materialStore';
import { SketchPicker } from 'react-color';
import TexturePanel from './TexturePanel';

const MaterialPanel: React.FC = () => {
  const [materials, selectedMaterialId, addMaterial, updateMaterial, removeMaterial, selectMaterial] = 
    useMaterialStore((state) => [
      state.materials,
      state.selectedMaterialId,
      state.addMaterial,
      state.updateMaterial,
      state.removeMaterial,
      state.selectMaterial,
    ]);

  const [colorPickerOpen, setColorPickerOpen] = React.useState(false);
  const [newMaterialDialogOpen, setNewMaterialDialogOpen] = React.useState(false);
  const [newMaterialName, setNewMaterialName] = React.useState('');

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  const handleAddMaterial = () => {
    addMaterial({
      name: newMaterialName || 'New Material',
      type: 'standard',
      color: '#ffffff',
      metalness: 0,
      roughness: 0.5,
    });
    setNewMaterialName('');
    setNewMaterialDialogOpen(false);
  };

  const handleUpdateMaterial = useCallback(
    (updates: Partial<Material>) => {
      if (selectedMaterialId) {
        updateMaterial(selectedMaterialId, updates);
      }
    },
    [selectedMaterialId, updateMaterial]
  );

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        right: 16,
        top: 380,
        width: 300,
        p: 2,
        backgroundColor: 'background.paper',
        maxHeight: 'calc(100vh - 400px)',
        overflowY: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Materials</Typography>
        <IconButton onClick={() => setNewMaterialDialogOpen(true)}>
          <AddIcon />
        </IconButton>
      </Box>

      <List>
        {materials.map((material) => (
          <ListItem
            key={material.id}
            selected={material.id === selectedMaterialId}
            onClick={() => selectMaterial(material.id)}
            secondaryAction={
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  removeMaterial(material.id);
                }}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText primary={material.name} />
          </ListItem>
        ))}
      </List>

      {selectedMaterial && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Properties
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setColorPickerOpen(true)}
              sx={{
                backgroundColor: selectedMaterial.color,
                '&:hover': {
                  backgroundColor: selectedMaterial.color,
                },
              }}
            >
              Color
            </Button>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>Metalness</Typography>
            <Slider
              value={selectedMaterial.metalness || 0}
              onChange={(_, value) => handleUpdateMaterial({ metalness: value as number })}
              min={0}
              max={1}
              step={0.01}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>Roughness</Typography>
            <Slider
              value={selectedMaterial.roughness || 0.5}
              onChange={(_, value) => handleUpdateMaterial({ roughness: value as number })}
              min={0}
              max={1}
              step={0.01}
            />
          </Box>

          {selectedMaterial.transparent && (
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Opacity</Typography>
              <Slider
                value={selectedMaterial.opacity || 1}
                onChange={(_, value) => handleUpdateMaterial({ opacity: value as number })}
                min={0}
                max={1}
                step={0.01}
              />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          
          <TexturePanel materialId={selectedMaterial.id} />
        </Box>
      )}

      <Dialog open={colorPickerOpen} onClose={() => setColorPickerOpen(false)}>
        <DialogContent>
          <SketchPicker
            color={selectedMaterial?.color || '#ffffff'}
            onChange={(color) => handleUpdateMaterial({ color: color.hex })}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={newMaterialDialogOpen} onClose={() => setNewMaterialDialogOpen(false)}>
        <DialogTitle>New Material</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Material Name"
            fullWidth
            value={newMaterialName}
            onChange={(e) => setNewMaterialName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewMaterialDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddMaterial}>Create</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MaterialPanel;
