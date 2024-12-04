import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Button,
  Typography,
  Popover,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Create as DrawIcon,
  ChatBubble as CommentIcon,
  PushPin as PinIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  ColorLens,
} from '@mui/icons-material';
import { SketchPicker } from 'react-color';
import { useCollaborationStore } from '../../store/collaborationStore';
import { websocketService } from '../../services/websocketService';

interface Annotation {
  id: string;
  type: 'drawing' | 'comment' | 'pin';
  position: { x: number; y: number; z: number };
  content: string;
  style?: {
    color: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
  author: string;
  timestamp: number;
  points?: { x: number; y: number; z: number }[];
}

interface AnnotationSystemProps {
  onAnnotationClick?: (annotation: Annotation) => void;
  onAnnotationCreate?: (annotation: Annotation) => void;
  onAnnotationUpdate?: (annotation: Annotation) => void;
  onAnnotationDelete?: (annotationId: string) => void;
}

const AnnotationSystem: React.FC<AnnotationSystemProps> = ({
  onAnnotationClick,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);
  const [toolMenuAnchor, setToolMenuAnchor] = useState<null | HTMLElement>(null);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<null | HTMLElement>(null);
  const [editMode, setEditMode] = useState<'draw' | 'comment' | 'pin' | null>(null);
  const [tempPoints, setTempPoints] = useState<{ x: number; y: number; z: number }[]>([]);
  const [annotationText, setAnnotationText] = useState('');
  const [textStyle, setTextStyle] = useState({
    color: '#ff0000',
    fontSize: 14,
    bold: false,
    italic: false,
    underline: false,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentUserId, users } = useCollaborationStore();

  useEffect(() => {
    // Subscribe to annotation updates from WebSocket
    const handleAnnotationUpdate = (data: any) => {
      switch (data.type) {
        case 'annotation_created':
          setAnnotations((prev) => [...prev, data.annotation]);
          break;
        case 'annotation_updated':
          setAnnotations((prev) =>
            prev.map((ann) =>
              ann.id === data.annotation.id ? data.annotation : ann
            )
          );
          break;
        case 'annotation_deleted':
          setAnnotations((prev) =>
            prev.filter((ann) => ann.id !== data.annotationId)
          );
          break;
      }
    };

    // Add WebSocket listener
    // websocketService.addListener('annotation', handleAnnotationUpdate);

    return () => {
      // Remove WebSocket listener
      // websocketService.removeListener('annotation', handleAnnotationUpdate);
    };
  }, []);

  const handleToolSelect = (tool: 'draw' | 'comment' | 'pin') => {
    setEditMode(tool);
    setToolMenuAnchor(null);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editMode || !canvasRef.current || !currentUserId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const z = 0; // You'll need to get the actual Z coordinate from your 3D scene

    switch (editMode) {
      case 'draw':
        setTempPoints((prev) => [...prev, { x, y, z }]);
        break;

      case 'comment':
      case 'pin':
        const newAnnotation: Annotation = {
          id: Math.random().toString(36).substr(2, 9),
          type: editMode,
          position: { x, y, z },
          content: '',
          style: { ...textStyle },
          author: currentUserId,
          timestamp: Date.now(),
        };
        setActiveAnnotation(newAnnotation);
        break;
    }
  };

  const handleAnnotationSave = () => {
    if (!activeAnnotation || !currentUserId) return;

    const finalAnnotation: Annotation = {
      ...activeAnnotation,
      content: annotationText,
      points: editMode === 'draw' ? tempPoints : undefined,
    };

    if (activeAnnotation.id) {
      // Update existing annotation
      setAnnotations((prev) =>
        prev.map((ann) =>
          ann.id === activeAnnotation.id ? finalAnnotation : ann
        )
      );
      onAnnotationUpdate?.(finalAnnotation);
      websocketService.send({
        type: 'annotation_updated',
        payload: finalAnnotation,
      });
    } else {
      // Create new annotation
      setAnnotations((prev) => [...prev, finalAnnotation]);
      onAnnotationCreate?.(finalAnnotation);
      websocketService.send({
        type: 'annotation_created',
        payload: finalAnnotation,
      });
    }

    setActiveAnnotation(null);
    setAnnotationText('');
    setTempPoints([]);
    setEditMode(null);
  };

  const handleAnnotationDelete = (annotationId: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== annotationId));
    onAnnotationDelete?.(annotationId);
    websocketService.send({
      type: 'annotation_deleted',
      payload: { annotationId },
    });
  };

  const renderAnnotations = () => {
    if (!canvasRef.current) return null;

    return annotations.map((annotation) => {
      const { x, y } = annotation.position;
      const user = users[annotation.author];

      return (
        <Fade key={annotation.id} in={true}>
          <Box
            sx={{
              position: 'absolute',
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {annotation.type === 'pin' && (
              <Tooltip
                title={
                  <Box>
                    <Typography variant="caption" display="block">
                      {user?.name || 'Unknown User'}
                    </Typography>
                    <Typography>{annotation.content}</Typography>
                  </Box>
                }
              >
                <PinIcon
                  sx={{
                    color: annotation.style?.color || '#ff0000',
                    cursor: 'pointer',
                  }}
                  onClick={() => onAnnotationClick?.(annotation)}
                />
              </Tooltip>
            )}

            {annotation.type === 'comment' && (
              <Paper
                sx={{
                  p: 1,
                  maxWidth: 200,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                <Typography variant="caption" display="block">
                  {user?.name || 'Unknown User'}
                </Typography>
                <Typography
                  sx={{
                    color: annotation.style?.color,
                    fontWeight: annotation.style?.bold ? 'bold' : 'normal',
                    fontStyle: annotation.style?.italic ? 'italic' : 'normal',
                    textDecoration: annotation.style?.underline
                      ? 'underline'
                      : 'none',
                  }}
                >
                  {annotation.content}
                </Typography>
              </Paper>
            )}
          </Box>
        </Fade>
      );
    });
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: editMode ? 'crosshair' : 'default',
        }}
        onClick={handleCanvasClick}
      />

      {renderAnnotations()}

      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        <IconButton onClick={(e) => setToolMenuAnchor(e.currentTarget)}>
          <DrawIcon />
        </IconButton>
      </Box>

      <Menu
        anchorEl={toolMenuAnchor}
        open={Boolean(toolMenuAnchor)}
        onClose={() => setToolMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleToolSelect('draw')}>
          <ListItemIcon>
            <DrawIcon />
          </ListItemIcon>
          <ListItemText primary="Draw" />
        </MenuItem>
        <MenuItem onClick={() => handleToolSelect('comment')}>
          <ListItemIcon>
            <CommentIcon />
          </ListItemIcon>
          <ListItemText primary="Comment" />
        </MenuItem>
        <MenuItem onClick={() => handleToolSelect('pin')}>
          <ListItemIcon>
            <PinIcon />
          </ListItemIcon>
          <ListItemText primary="Pin" />
        </MenuItem>
      </Menu>

      {activeAnnotation && (
        <Paper
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            p: 2,
            width: '80%',
            maxWidth: 500,
          }}
        >
          <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={(e) => setColorPickerAnchor(e.currentTarget)}
            >
              <ColorLens />
            </IconButton>
            <IconButton
              size="small"
              onClick={() =>
                setTextStyle((prev) => ({ ...prev, bold: !prev.bold }))
              }
            >
              <FormatBold />
            </IconButton>
            <IconButton
              size="small"
              onClick={() =>
                setTextStyle((prev) => ({ ...prev, italic: !prev.italic }))
              }
            >
              <FormatItalic />
            </IconButton>
            <IconButton
              size="small"
              onClick={() =>
                setTextStyle((prev) => ({
                  ...prev,
                  underline: !prev.underline,
                }))
              }
            >
              <FormatUnderlined />
            </IconButton>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            placeholder="Enter annotation text..."
          />

          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              startIcon={<CancelIcon />}
              onClick={() => {
                setActiveAnnotation(null);
                setAnnotationText('');
                setTempPoints([]);
                setEditMode(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleAnnotationSave}
              disabled={!annotationText.trim()}
            >
              Save
            </Button>
          </Box>
        </Paper>
      )}

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
          color={textStyle.color}
          onChange={(color) =>
            setTextStyle((prev) => ({ ...prev, color: color.hex }))
          }
        />
      </Popover>
    </Box>
  );
};

export default AnnotationSystem;
