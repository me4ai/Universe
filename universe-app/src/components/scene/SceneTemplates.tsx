import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  TextField,
  DialogActions,
} from '@mui/material';
import { SceneManagementService, SceneMetadata } from '../../services/sceneManagement';

interface SceneTemplatesProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string, name: string, description: string) => void;
}

export const SceneTemplates: React.FC<SceneTemplatesProps> = ({
  open,
  onClose,
  onSelectTemplate,
}) => {
  const [templates, setTemplates] = useState<SceneMetadata[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SceneMetadata | null>(null);
  const [sceneName, setSceneName] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  
  const sceneService = SceneManagementService.getInstance();

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    const availableTemplates = await sceneService.getTemplates();
    setTemplates(availableTemplates);
  };

  const handleTemplateSelect = (template: SceneMetadata) => {
    setSelectedTemplate(template);
    setSceneName(`${template.name} Copy`);
    setSceneDescription(template.description);
  };

  const handleCreate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate.id, sceneName, sceneDescription);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Choose a Template</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card
                onClick={() => handleTemplateSelect(template)}
                sx={{
                  cursor: 'pointer',
                  border: selectedTemplate?.id === template.id ? 2 : 0,
                  borderColor: 'primary.main',
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={template.thumbnail || '/default-template-thumbnail.png'}
                  alt={template.name}
                />
                <CardContent>
                  <Typography variant="h6" noWrap>
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {templates.length === 0 && (
          <Box textAlign="center" py={3}>
            <Typography color="text.secondary">
              No templates available
            </Typography>
          </Box>
        )}

        {selectedTemplate && (
          <Box mt={3}>
            <TextField
              fullWidth
              label="Scene Name"
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!selectedTemplate || !sceneName}
        >
          Create Scene
        </Button>
      </DialogActions>
    </Dialog>
  );
};
