import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Button,
  Divider,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { GLTFHandler, SceneComparison } from '../../utils/gltfHandler';
import { useAdvancedSceneStore } from '../../store/advancedSceneStore';
import { Shape } from '../../store/sceneStore';

interface VersionComparisonProps {
  open: boolean;
  onClose: () => void;
  versionA: string;
  versionB: string;
}

export const VersionComparison: React.FC<VersionComparisonProps> = ({
  open,
  onClose,
  versionA,
  versionB,
}) => {
  const [comparison, setComparison] = useState<SceneComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVersions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sceneA = await useAdvancedSceneStore.getState().loadScene(versionA);
      const sceneB = await useAdvancedSceneStore.getState().loadScene(versionB);
      const diff = GLTFHandler.compareScenes(sceneA, sceneB);
      setComparison(diff);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare versions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open, versionA, versionB]);

  const renderShapeChanges = (changes: any) => {
    return Object.entries(changes).map(([property, values]: [string, any]) => (
      <Box key={property} ml={2}>
        <Typography variant="body2" color="text.secondary">
          {property}:
          <Chip
            size="small"
            label={JSON.stringify(values.before)}
            sx={{ ml: 1, mr: 1 }}
          />
          →
          <Chip
            size="small"
            label={JSON.stringify(values.after)}
            sx={{ ml: 1 }}
            color="primary"
          />
        </Typography>
      </Box>
    ));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CompareArrowsIcon />
          <Typography>Version Comparison</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <Typography>Loading comparison...</Typography>
          </Box>
        ) : error ? (
          <Box p={2}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : comparison ? (
          <Grid container spacing={2}>
            {/* Added Objects */}
            <Grid item xs={12}>
              <Typography variant="h6" color="success.main" gutterBottom>
                <AddIcon fontSize="small" /> Added Objects ({comparison.added.length})
              </Typography>
              <List dense>
                {comparison.added.map((shape) => (
                  <ListItem key={shape.id}>
                    <ListItemText
                      primary={shape.name}
                      secondary={`Type: ${shape.type}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Removed Objects */}
            <Grid item xs={12}>
              <Typography variant="h6" color="error.main" gutterBottom>
                <RemoveIcon fontSize="small" /> Removed Objects ({comparison.removed.length})
              </Typography>
              <List dense>
                {comparison.removed.map((shape) => (
                  <ListItem key={shape.id}>
                    <ListItemText
                      primary={shape.name}
                      secondary={`Type: ${shape.type}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Modified Objects */}
            <Grid item xs={12}>
              <Typography variant="h6" color="info.main" gutterBottom>
                <CompareArrowsIcon fontSize="small" /> Modified Objects ({comparison.modified.length})
              </Typography>
              <List dense>
                {comparison.modified.map(({ before, after, changes }) => (
                  <ListItem key={before.id}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2">
                          {before.name} → {after.name}
                        </Typography>
                      }
                      secondary={renderShapeChanges(changes)}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Summary */}
            <Grid item xs={12}>
              <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
                <Typography variant="subtitle1" gutterBottom>
                  Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Tooltip title="New objects added in the newer version">
                      <Chip
                        icon={<AddIcon />}
                        label={`${comparison.added.length} Added`}
                        color="success"
                      />
                    </Tooltip>
                  </Grid>
                  <Grid item xs={4}>
                    <Tooltip title="Objects removed from the older version">
                      <Chip
                        icon={<RemoveIcon />}
                        label={`${comparison.removed.length} Removed`}
                        color="error"
                      />
                    </Tooltip>
                  </Grid>
                  <Grid item xs={4}>
                    <Tooltip title="Objects that exist in both versions but were modified">
                      <Chip
                        icon={<CompareArrowsIcon />}
                        label={`${comparison.modified.length} Modified`}
                        color="info"
                      />
                    </Tooltip>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        ) : null}

        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button onClick={onClose}>Close</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
