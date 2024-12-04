import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Slider,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useSceneStore } from '../../store/sceneStore';

const PropertiesPanel: React.FC = () => {
  const selectedShapeId = useSceneStore((state) => state.selectedShapeId);
  const shapes = useSceneStore((state) => state.shapes);
  const updateShape = useSceneStore((state) => state.updateShape);

  const selectedShape = shapes.find((shape) => shape.id === selectedShapeId);

  if (!selectedShape) {
    return null;
  }

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const position = [...selectedShape.position] as [number, number, number];
    position['xyz'.indexOf(axis)] = value;
    updateShape(selectedShape.id, { position });
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const rotation = [...selectedShape.rotation] as [number, number, number];
    rotation['xyz'.indexOf(axis)] = value * (Math.PI / 180);
    updateShape(selectedShape.id, { rotation });
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const scale = [...selectedShape.scale] as [number, number, number];
    scale['xyz'.indexOf(axis)] = value;
    updateShape(selectedShape.id, { scale });
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        right: 16,
        top: 80,
        width: 300,
        p: 2,
        backgroundColor: 'background.paper',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Properties
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Position
        </Typography>
        {['x', 'y', 'z'].map((axis) => (
          <TextField
            key={`pos-${axis}`}
            label={`${axis.toUpperCase()} Position`}
            type="number"
            value={selectedShape.position['xyz'.indexOf(axis)]}
            onChange={(e) =>
              handlePositionChange(axis as 'x' | 'y' | 'z', parseFloat(e.target.value) || 0)
            }
            fullWidth
            margin="dense"
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        ))}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Rotation
        </Typography>
        {['x', 'y', 'z'].map((axis) => (
          <TextField
            key={`rot-${axis}`}
            label={`${axis.toUpperCase()} Rotation`}
            type="number"
            value={(selectedShape.rotation['xyz'.indexOf(axis)] * 180) / Math.PI}
            onChange={(e) =>
              handleRotationChange(axis as 'x' | 'y' | 'z', parseFloat(e.target.value) || 0)
            }
            fullWidth
            margin="dense"
            InputProps={{
              endAdornment: <InputAdornment position="end">°</InputAdornment>,
            }}
          />
        ))}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Scale
        </Typography>
        {['x', 'y', 'z'].map((axis) => (
          <TextField
            key={`scale-${axis}`}
            label={`${axis.toUpperCase()} Scale`}
            type="number"
            value={selectedShape.scale['xyz'.indexOf(axis)]}
            onChange={(e) =>
              handleScaleChange(axis as 'x' | 'y' | 'z', parseFloat(e.target.value) || 1)
            }
            fullWidth
            margin="dense"
          />
        ))}
      </Box>
    </Paper>
  );
};

export default PropertiesPanel;
