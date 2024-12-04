import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  Paper,
  Slider,
  TextField,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as ResetIcon,
  Image as ImageIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useTextureStore } from '../../store/textureStore';
import { useDropzone } from 'react-dropzone';
import * as THREE from 'three';

interface TexturePreviewProps {
  texture: THREE.Texture;
  size?: number;
}

const TexturePreview: React.FC<TexturePreviewProps> = ({ texture, size = 100 }) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (ctx && texture.image) {
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(texture.image, 0, 0, size, size);
  }

  return (
    <Box
      component="img"
      src={canvas.toDataURL()}
      sx={{
        width: size,
        height: size,
        objectFit: 'cover',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    />
  );
};

interface TextureEditorDialogProps {
  open: boolean;
  textureId: string | null;
  onClose: () => void;
}

const TextureEditorDialog: React.FC<TextureEditorDialogProps> = ({ open, textureId, onClose }) => {
  const { textures, updateTexture } = useTextureStore();
  const texture = textureId ? textures[textureId] : null;

  const [settings, setSettings] = useState({
    repeat: { x: 1, y: 1 },
    offset: { x: 0, y: 0 },
    rotation: 0,
    flipY: true,
  });

  const handleChange = (property: string, axis: 'x' | 'y' | null, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [property]: axis ? { ...prev[property as keyof typeof prev], [axis]: value } : value,
    }));

    if (textureId) {
      updateTexture(textureId, {
        ...settings,
        [property]: axis ? { ...settings[property as keyof typeof settings], [axis]: value } : value,
      });
    }
  };

  if (!texture) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Texture</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TexturePreview texture={texture.texture} size={200} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography gutterBottom>Repeat X</Typography>
            <Slider
              value={settings.repeat.x}
              onChange={(_, value) => handleChange('repeat', 'x', value as number)}
              min={0.1}
              max={10}
              step={0.1}
            />

            <Typography gutterBottom>Repeat Y</Typography>
            <Slider
              value={settings.repeat.y}
              onChange={(_, value) => handleChange('repeat', 'y', value as number)}
              min={0.1}
              max={10}
              step={0.1}
            />

            <Typography gutterBottom>Offset X</Typography>
            <Slider
              value={settings.offset.x}
              onChange={(_, value) => handleChange('offset', 'x', value as number)}
              min={-1}
              max={1}
              step={0.01}
            />

            <Typography gutterBottom>Offset Y</Typography>
            <Slider
              value={settings.offset.y}
              onChange={(_, value) => handleChange('offset', 'y', value as number)}
              min={-1}
              max={1}
              step={0.01}
            />

            <Typography gutterBottom>Rotation (degrees)</Typography>
            <Slider
              value={settings.rotation}
              onChange={(_, value) => handleChange('rotation', null, value as number)}
              min={0}
              max={360}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const TextureManager: React.FC = () => {
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    textureId: string;
  } | null>(null);

  const { textures, addTexture, removeTexture } = useTextureStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const image = new Image();
            image.src = event.target.result as string;
            image.onload = () => {
              const texture = new THREE.Texture(image);
              texture.needsUpdate = true;
              addTexture({
                name: file.name,
                texture,
                type: 'diffuse', // default type
                settings: {
                  repeat: { x: 1, y: 1 },
                  offset: { x: 0, y: 0 },
                  rotation: 0,
                  flipY: true,
                },
              });
            };
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [addTexture]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.bmp', '.tga'],
    },
  });

  const handleContextMenu = (event: React.MouseEvent, textureId: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      textureId,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Textures</Typography>
      </Box>

      <Box
        {...getRootProps()}
        sx={{
          p: 2,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 1,
          m: 2,
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 40, color: 'action.active', mb: 1 }} />
        <Typography>
          {isDragActive ? 'Drop textures here' : 'Drag & drop textures here or click to select'}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Grid container spacing={2}>
          {Object.entries(textures).map(([id, { name, texture, type }]) => (
            <Grid item xs={6} sm={4} md={3} key={id}>
              <Paper
                sx={{
                  p: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => {
                  setSelectedTexture(id);
                  setEditorOpen(true);
                }}
                onContextMenu={(e) => handleContextMenu(e, id)}
              >
                <TexturePreview texture={texture} />
                <Typography variant="caption" noWrap>
                  {name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {type}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          onClick={() => {
            if (contextMenu) {
              setSelectedTexture(contextMenu.textureId);
              setEditorOpen(true);
            }
            handleContextMenuClose();
          }}
        >
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (contextMenu) {
              removeTexture(contextMenu.textureId);
            }
            handleContextMenuClose();
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <TextureEditorDialog
        open={editorOpen}
        textureId={selectedTexture}
        onClose={() => {
          setEditorOpen(false);
          setSelectedTexture(null);
        }}
      />
    </Box>
  );
};

export default TextureManager;
