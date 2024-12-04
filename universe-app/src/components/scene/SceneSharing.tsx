import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Chip,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { SceneManagementService, SceneMetadata } from '../../services/sceneManagement';
import { useAuth } from '../auth/AuthProvider';

interface SharingDialogProps {
  open: boolean;
  onClose: () => void;
  scene: SceneMetadata;
}

export const SceneSharing: React.FC<SharingDialogProps> = ({
  open,
  onClose,
  scene,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();
  
  const sceneService = SceneManagementService.getInstance();

  const handleShare = async () => {
    try {
      setError(null);
      setSuccess(null);

      // Basic email validation
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }

      // Check if already shared
      if (scene.sharedWith.includes(email)) {
        setError('This scene is already shared with this user');
        return;
      }

      // Share the scene
      await sceneService.shareScene(scene.id, email);
      
      setSuccess('Scene shared successfully');
      setEmail('');
    } catch (err) {
      setError('Failed to share the scene. Please try again.');
      console.error('Share error:', err);
    }
  };

  const handleRemoveShare = async (userEmail: string) => {
    try {
      setError(null);
      setSuccess(null);

      // Remove share access
      const updatedSharedWith = scene.sharedWith.filter(email => email !== userEmail);
      await sceneService.saveScene(scene, { ...scene, sharedWith: updatedSharedWith });
      
      setSuccess('Share access removed successfully');
    } catch (err) {
      setError('Failed to remove share access. Please try again.');
      console.error('Remove share error:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Scene</DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Scene: {scene.name}
          </Typography>
          <Chip
            label={`Owner: ${scene.createdBy}`}
            size="small"
            sx={{ mr: 1 }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box display="flex" gap={1} mb={3}>
          <TextField
            fullWidth
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to share with"
          />
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleShare}
          >
            Share
          </Button>
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Shared With
        </Typography>
        <List>
          {scene.sharedWith.map((userEmail) => (
            <ListItem key={userEmail}>
              <ListItemText
                primary={userEmail}
                secondary={userEmail === user?.email ? '(You)' : ''}
              />
              {scene.createdBy === user?.email && (
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveShare(userEmail)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>

        {scene.sharedWith.length === 0 && (
          <Typography color="text.secondary" align="center" py={2}>
            This scene hasn't been shared with anyone yet
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
