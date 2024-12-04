import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  IconButton,
  Grid,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Popover,
} from '@mui/material';
import {
  AspectRatio,
  CropFree,
  RotateRight,
  FlipHorizontal,
  FlipVertical,
  Lock,
  LockOpen,
  Refresh,
  ColorLens,
} from '@mui/icons-material';
import { SketchPicker } from 'react-color';
import { useTextureStore } from '../../store/textureStore';

interface Vector2 {
  x: number;
  y: number;
}

interface TextureTransform {
  offset: Vector2;
  repeat: Vector2;
  rotation: number;
  center: Vector2;
  flipX: boolean;
  flipY: boolean;
  tint: string;
  tintStrength: number;
}

interface TextureTransformEditorProps {
  textureId: string;
  onTransformChange?: (transform: TextureTransform) => void;
}

const TextureTransformEditor: React.FC<TextureTransformEditorProps> = ({
  textureId,
  onTransformChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transform, setTransform] = useState<TextureTransform>({
    offset: { x: 0, y: 0 },
    repeat: { x: 1, y: 1 },
    rotation: 0,
    center: { x: 0.5, y: 0.5 },
    flipX: false,
    flipY: false,
    tint: '#ffffff',
    tintStrength: 0,
  });
  const [aspectLocked, setAspectLocked] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Vector2>({ x: 0, y: 0 });
  const [colorPickerAnchor, setColorPickerAnchor] = useState<null | HTMLElement>(null);

  const { textures, updateTexture } = useTextureStore();
  const texture = textures[textureId];

  useEffect(() => {
    if (!texture || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 300;
    canvas.height = 300;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(transform.rotation * Math.PI / 180);
    ctx.scale(
      transform.flipX ? -1 : 1,
      transform.flipY ? -1 : 1
    );
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw grid
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw texture
    const image = texture.texture.image;
    if (image) {
      const pattern = ctx.createPattern(image, 'repeat');
      if (pattern) {
        const matrix = new DOMMatrix();
        matrix.translateSelf(
          transform.offset.x * canvas.width,
          transform.offset.y * canvas.height
        );
        matrix.scaleSelf(
          transform.repeat.x,
          transform.repeat.y
        );
        pattern.setTransform(matrix);
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    // Apply tint
    if (transform.tintStrength > 0) {
      ctx.fillStyle = transform.tint;
      ctx.globalAlpha = transform.tintStrength;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }

    // Restore context state
    ctx.restore();
  }, [texture, transform]);

  const handleTransformChange = (changes: Partial<TextureTransform>) => {
    const newTransform = { ...transform, ...changes };
    setTransform(newTransform);
    onTransformChange?.(newTransform);

    // Update texture in store
    updateTexture(textureId, {
      transform: newTransform,
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - rect.left - dragStart.x) / rect.width;
    const deltaY = (e.clientY - rect.top - dragStart.y) / rect.height;

    handleTransformChange({
      offset: {
        x: transform.offset.x + deltaX,
        y: transform.offset.y + deltaY,
      },
    });

    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRepeatChange = (axis: 'x' | 'y', value: number) => {
    if (aspectLocked && axis === 'x') {
      handleTransformChange({
        repeat: {
          x: value,
          y: value,
        },
      });
    } else {
      handleTransformChange({
        repeat: {
          ...transform.repeat,
          [axis]: value,
        },
      });
    }
  };

  const handleReset = () => {
    handleTransformChange({
      offset: { x: 0, y: 0 },
      repeat: { x: 1, y: 1 },
      rotation: 0,
      center: { x: 0.5, y: 0.5 },
      flipX: false,
      flipY: false,
      tint: '#ffffff',
      tintStrength: 0,
    });
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1">Texture Transform</Typography>
        <Tooltip title="Reset">
          <IconButton size="small" onClick={handleReset}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ mb: 2 }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 300,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography>Repeat</Typography>
            <Tooltip title={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}>
              <IconButton
                size="small"
                onClick={() => setAspectLocked(!aspectLocked)}
              >
                {aspectLocked ? <Lock /> : <LockOpen />}
              </IconButton>
            </Tooltip>
          </Box>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption">X</Typography>
              <Slider
                value={transform.repeat.x}
                onChange={(_, value) => handleRepeatChange('x', value as number)}
                min={0.1}
                max={10}
                step={0.1}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption">Y</Typography>
              <Slider
                value={transform.repeat.y}
                onChange={(_, value) => handleRepeatChange('y', value as number)}
                min={0.1}
                max={10}
                step={0.1}
                disabled={aspectLocked}
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Typography>Rotation</Typography>
          <Slider
            value={transform.rotation}
            onChange={(_, value) =>
              handleTransformChange({ rotation: value as number })
            }
            min={0}
            max={360}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
            <ToggleButton
              value="flipX"
              selected={transform.flipX}
              onChange={() =>
                handleTransformChange({ flipX: !transform.flipX })
              }
            >
              <FlipHorizontal />
            </ToggleButton>
            <ToggleButton
              value="flipY"
              selected={transform.flipY}
              onChange={() =>
                handleTransformChange({ flipY: !transform.flipY })
              }
            >
              <FlipVertical />
            </ToggleButton>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography>Tint</Typography>
            <IconButton
              size="small"
              onClick={(e) => setColorPickerAnchor(e.currentTarget)}
            >
              <ColorLens />
            </IconButton>
          </Box>
          <Slider
            value={transform.tintStrength}
            onChange={(_, value) =>
              handleTransformChange({ tintStrength: value as number })
            }
            min={0}
            max={1}
            step={0.01}
          />
        </Grid>
      </Grid>

      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={() => setColorPickerAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <SketchPicker
          color={transform.tint}
          onChange={(color) => handleTransformChange({ tint: color.hex })}
        />
      </Popover>
    </Paper>
  );
};

export default TextureTransformEditor;
