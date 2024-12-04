import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Button,
  Box,
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import CompareIcon from '@mui/icons-material/Compare';
import { SceneManagementService, SceneMetadata } from '../../services/sceneManagement';

interface VersionHistoryProps {
  open: boolean;
  onClose: () => void;
  sceneId: string;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  open,
  onClose,
  sceneId,
}) => {
  const [versions, setVersions] = useState<SceneMetadata[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  
  const sceneService = SceneManagementService.getInstance();

  useEffect(() => {
    if (open && sceneId) {
      loadVersions();
    }
  }, [open, sceneId]);

  const loadVersions = async () => {
    const sceneVersions = await sceneService.getSceneVersions(sceneId);
    setVersions(sceneVersions);
  };

  const handleRestore = async (version: number) => {
    try {
      await sceneService.loadScene(sceneId, version);
      onClose();
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  };

  const handleCompare = (version: number) => {
    setSelectedVersion(String(version));
    setIsComparing(true);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Version History</DialogTitle>
      <DialogContent>
        <List>
          {versions.map((version, index) => (
            <ListItem
              key={version.version}
              divider={index < versions.length - 1}
            >
              <ListItemText
                primary={`Version ${version.version}`}
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" color="text.primary">
                      {new Date(version.updatedAt).toLocaleString()}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2">
                      by {version.createdBy}
                    </Typography>
                  </React.Fragment>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="compare"
                  onClick={() => handleCompare(version.version)}
                  sx={{ mr: 1 }}
                >
                  <CompareIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="restore"
                  onClick={() => handleRestore(version.version)}
                >
                  <RestoreIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {versions.length === 0 && (
          <Box textAlign="center" py={3}>
            <Typography color="text.secondary">
              No version history available
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
