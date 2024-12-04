import React, { useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useMaterialStore, Texture } from '../../store/materialStore';
import { createTextureFromFile } from '../../utils/textureLoader';

interface TexturePanelProps {
  materialId: string;
}

const TexturePanel: React.FC<TexturePanelProps> = ({ materialId }) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [textureName, setTextureName] = React.useState('');
  const [textureType, setTextureType] = React.useState<Texture['type']>('map');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [materials, addTexture, removeTexture] = useMaterialStore((state) => [
    state.materials,
    state.addTexture,
    state.removeTexture,
  ]);

  const material = materials.find((m) => m.id === materialId);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const textureUrl = await createTextureFromFile(file);
        addTexture(materialId, {
          name: textureName || file.name,
          type: textureType,
          url: textureUrl,
        });
        setDialogOpen(false);
        setTextureName('');
      } catch (error) {
        console.error('Failed to load texture:', error);
      }
    }
  };

  const handleAddTexture = () => {
    fileInputRef.current?.click();
  };

  if (!material) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1">Textures</Typography>
        <Button
          startIcon={<AddIcon />}
          size="small"
          onClick={() => setDialogOpen(true)}
        >
          Add Texture
        </Button>
      </Box>

      <List dense>
        {material.textures.map((texture) => (
          <ListItem key={texture.id}>
            <ListItemText
              primary={texture.name}
              secondary={texture.type}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => removeTexture(materialId, texture.id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add Texture</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Texture Name"
            fullWidth
            value={textureName}
            onChange={(e) => setTextureName(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Texture Type</InputLabel>
            <Select
              value={textureType}
              onChange={(e) => setTextureType(e.target.value as Texture['type'])}
            >
              <MenuItem value="map">Color Map</MenuItem>
              <MenuItem value="normalMap">Normal Map</MenuItem>
              <MenuItem value="roughnessMap">Roughness Map</MenuItem>
              <MenuItem value="metalnessMap">Metalness Map</MenuItem>
              <MenuItem value="aoMap">Ambient Occlusion Map</MenuItem>
            </Select>
          </FormControl>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileSelect}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddTexture} color="primary">
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TexturePanel;
