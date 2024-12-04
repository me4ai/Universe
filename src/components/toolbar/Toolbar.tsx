import React, { useRef } from 'react';
import {
  AppBar,
  Toolbar as MuiToolbar,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Undo,
  Redo,
  Save,
  Upload,
  Download,
} from '@mui/icons-material';
import { useSceneStore } from '../../store/sceneStore';
import { useMaterialStore } from '../../store/materialStore';
import { exportScene, importScene, exportToFormat } from '../../utils/fileHandling';

const Toolbar: React.FC = () => {
  const [undo, redo, shapes, saveScene, loadScene] = useSceneStore((state) => [
    state.undo,
    state.redo,
    state.shapes,
    state.saveScene,
    state.loadScene,
  ]);

  const materials = useMaterialStore((state) => state.materials);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const sceneData = await importScene(file);
        loadScene(sceneData.shapes);
      } catch (error) {
        console.error('Failed to import scene:', error);
        // You might want to show an error message to the user here
      }
    }
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportFormat = async (format: 'obj' | 'stl' | 'gltf') => {
    await exportToFormat(shapes, materials, format);
    handleExportClose();
  };

  return (
    <AppBar position="static" color="default" sx={{ top: 64 }}>
      <MuiToolbar variant="dense">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleImport}
        />
        
        <Tooltip title="Undo">
          <IconButton onClick={undo}>
            <Undo />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Redo">
          <IconButton onClick={redo}>
            <Redo />
          </IconButton>
        </Tooltip>

        <Tooltip title="Save Scene">
          <IconButton onClick={saveScene}>
            <Save />
          </IconButton>
        </Tooltip>

        <Tooltip title="Import Scene">
          <IconButton onClick={() => fileInputRef.current?.click()}>
            <Upload />
          </IconButton>
        </Tooltip>

        <Tooltip title="Export Scene">
          <IconButton onClick={handleExportClick}>
            <Download />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={handleExportClose}
        >
          <MenuItem onClick={() => handleExportFormat('obj')}>
            Export as OBJ
          </MenuItem>
          <MenuItem onClick={() => handleExportFormat('stl')}>
            Export as STL
          </MenuItem>
          <MenuItem onClick={() => handleExportFormat('gltf')}>
            Export as GLTF
          </MenuItem>
          <MenuItem onClick={() => {
            exportScene(shapes, materials);
            handleExportClose();
          }}>
            Export as Universe Scene
          </MenuItem>
        </Menu>
      </MuiToolbar>
    </AppBar>
  );
};

export default Toolbar;
