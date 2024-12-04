import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Slider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material';
import {
  ContentCopy as DuplicateIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { SketchPicker } from 'react-color';
import { useAdvancedMaterialStore, MaterialType } from '../../store/advancedMaterialStore';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`material-tabpanel-${index}`}
    aria-labelledby={`material-tab-${index}`}
  >
    {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
  </div>
);

const AdvancedMaterialEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorType, setColorType] = useState<'main' | 'emissive' | 'sheen'>('main');

  const {
    materials,
    selectedMaterialId,
    presets,
    updateMaterial,
    duplicateMaterial,
    removeMaterial,
    convertMaterialType,
    applyPreset,
  } = useAdvancedMaterialStore();

  const material = selectedMaterialId ? materials[selectedMaterialId] : null;

  if (!material) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography>No material selected</Typography>
      </Paper>
    );
  }

  const handleColorChange = (color: any) => {
    if (!selectedMaterialId) return;

    switch (colorType) {
      case 'main':
        updateMaterial(selectedMaterialId, { color: color.hex });
        break;
      case 'emissive':
        updateMaterial(selectedMaterialId, { emissive: color.hex });
        break;
      case 'sheen':
        updateMaterial(selectedMaterialId, { sheenColor: color.hex });
        break;
    }
  };

  const handleNumericChange = (property: keyof typeof material) => (
    event: React.ChangeEvent<HTMLInputElement> | Event,
    value: number | number[]
  ) => {
    if (!selectedMaterialId) return;
    updateMaterial(selectedMaterialId, { [property]: value });
  };

  const handleTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    if (!selectedMaterialId) return;
    convertMaterialType(selectedMaterialId, event.target.value as MaterialType);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Basic" />
          <Tab label="Advanced" />
          <Tab label="Textures" />
          <Tab label="Presets" />
        </Tabs>
      </Box>

      <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
        <Tooltip title="Duplicate Material">
          <IconButton onClick={() => selectedMaterialId && duplicateMaterial(selectedMaterialId)}>
            <DuplicateIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Material">
          <IconButton onClick={() => selectedMaterialId && removeMaterial(selectedMaterialId)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Material Type</InputLabel>
          <Select value={material.type || 'standard'} onChange={handleTypeChange}>
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="physical">Physical</MenuItem>
            <MenuItem value="toon">Toon</MenuItem>
            <MenuItem value="matcap">Matcap</MenuItem>
            <MenuItem value="normal">Normal</MenuItem>
            <MenuItem value="phong">Phong</MenuItem>
            <MenuItem value="lambert">Lambert</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<PaletteIcon />}
            onClick={() => {
              setColorType('main');
              setColorPickerOpen(true);
            }}
            sx={{
              backgroundColor: material.color,
              '&:hover': {
                backgroundColor: material.color,
              },
            }}
          >
            Color
          </Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Metalness</Typography>
          <Slider
            value={material.metalness}
            onChange={handleNumericChange('metalness')}
            min={0}
            max={1}
            step={0.01}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Roughness</Typography>
          <Slider
            value={material.roughness}
            onChange={handleNumericChange('roughness')}
            min={0}
            max={1}
            step={0.01}
          />
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={material.transparent}
              onChange={(e) =>
                selectedMaterialId &&
                updateMaterial(selectedMaterialId, { transparent: e.target.checked })
              }
            />
          }
          label="Transparent"
        />

        {material.transparent && (
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Opacity</Typography>
            <Slider
              value={material.opacity}
              onChange={handleNumericChange('opacity')}
              min={0}
              max={1}
              step={0.01}
            />
          </Box>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<PaletteIcon />}
            onClick={() => {
              setColorType('emissive');
              setColorPickerOpen(true);
            }}
          >
            Emissive Color
          </Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Emissive Intensity</Typography>
          <Slider
            value={material.emissiveIntensity}
            onChange={handleNumericChange('emissiveIntensity')}
            min={0}
            max={1}
            step={0.01}
          />
        </Box>

        {material.type === 'physical' && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Physical Properties
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Clearcoat</Typography>
              <Slider
                value={material.clearcoat}
                onChange={handleNumericChange('clearcoat')}
                min={0}
                max={1}
                step={0.01}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Clearcoat Roughness</Typography>
              <Slider
                value={material.clearcoatRoughness}
                onChange={handleNumericChange('clearcoatRoughness')}
                min={0}
                max={1}
                step={0.01}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Transmission</Typography>
              <Slider
                value={material.transmission}
                onChange={handleNumericChange('transmission')}
                min={0}
                max={1}
                step={0.01}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Thickness</Typography>
              <Slider
                value={material.thickness}
                onChange={handleNumericChange('thickness')}
                min={0}
                max={5}
                step={0.1}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                startIcon={<PaletteIcon />}
                onClick={() => {
                  setColorType('sheen');
                  setColorPickerOpen(true);
                }}
              >
                Sheen Color
              </Button>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Sheen</Typography>
              <Slider
                value={material.sheen}
                onChange={handleNumericChange('sheen')}
                min={0}
                max={1}
                step={0.01}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Sheen Roughness</Typography>
              <Slider
                value={material.sheenRoughness}
                onChange={handleNumericChange('sheenRoughness')}
                min={0}
                max={1}
                step={0.01}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Iridescence</Typography>
              <Slider
                value={material.iridescence}
                onChange={handleNumericChange('iridescence')}
                min={0}
                max={1}
                step={0.01}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Iridescence IOR</Typography>
              <Slider
                value={material.iridescenceIOR}
                onChange={handleNumericChange('iridescenceIOR')}
                min={1}
                max={2.333}
                step={0.01}
              />
            </Box>
          </>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* Texture management will be implemented in a separate component */}
        <Typography>Texture management coming soon...</Typography>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          {presets.map((preset) => (
            <Button
              key={preset.id}
              variant="outlined"
              onClick={() => selectedMaterialId && applyPreset(selectedMaterialId, preset.id)}
              startIcon={<PaletteIcon />}
            >
              {preset.name}
            </Button>
          ))}
        </Box>
      </TabPanel>

      {colorPickerOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1300,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 2,
          }}
        >
          <SketchPicker
            color={
              colorType === 'main'
                ? material.color
                : colorType === 'emissive'
                ? material.emissive
                : material.sheenColor
            }
            onChange={handleColorChange}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={() => setColorPickerOpen(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AdvancedMaterialEditor;
