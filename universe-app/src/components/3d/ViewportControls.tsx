import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
} from '@mui/material';
import {
  ViewQuilt as ViewQuiltIcon,
  GridView as GridViewIcon,
  ViewAgenda as ViewAgendaIcon,
  Visibility as VisibilityIcon,
  CameraAlt as CameraIcon,
  GridOn as GridIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import create from 'zustand';

export type ViewportLayout = 'single' | 'double' | 'triple' | 'quad';
export type ViewportType = 'perspective' | 'front' | 'top' | 'right';

interface Viewport {
  type: ViewportType;
  showGrid: boolean;
  showAxes: boolean;
  showStats: boolean;
}

interface ViewportState {
  layout: ViewportLayout;
  viewports: { [key: string]: Viewport };
  activeViewport: string;
  
  setLayout: (layout: ViewportLayout) => void;
  setViewportType: (id: string, type: ViewportType) => void;
  toggleViewportGrid: (id: string) => void;
  toggleViewportAxes: (id: string) => void;
  toggleViewportStats: (id: string) => void;
  setActiveViewport: (id: string) => void;
}

export const useViewportStore = create<ViewportState>((set) => ({
  layout: 'single',
  viewports: {
    main: {
      type: 'perspective',
      showGrid: true,
      showAxes: true,
      showStats: false,
    },
  },
  activeViewport: 'main',

  setLayout: (layout) => {
    set((state) => {
      const viewports: { [key: string]: Viewport } = {};
      
      switch (layout) {
        case 'single':
          viewports.main = state.viewports.main || {
            type: 'perspective',
            showGrid: true,
            showAxes: true,
            showStats: false,
          };
          break;
          
        case 'double':
          viewports.left = state.viewports.left || {
            type: 'perspective',
            showGrid: true,
            showAxes: true,
            showStats: false,
          };
          viewports.right = state.viewports.right || {
            type: 'top',
            showGrid: true,
            showAxes: true,
            showStats: false,
          };
          break;
          
        case 'triple':
          viewports.main = state.viewports.main || {
            type: 'perspective',
            showGrid: true,
            showAxes: true,
            showStats: false,
          };
          viewports.top = state.viewports.top || {
            type: 'top',
            showGrid: true,
            showAxes: true,
            showStats: false,
          };
          viewports.right = state.viewports.right || {
            type: 'right',
            showGrid: true,
            showAxes: true,
            showStats: false,
          };
          break;
          
        case 'quad':
          viewports.topLeft = state.viewports.topLeft || {
            type: 'perspective',
            showGrid: true,
            showAxes: true,
            showStats: false,
          };
          viewports.topRight = state.viewports.topRight || {
            type: 'top',
            showGrid: true,
            showAxes: true,
            showStats: false,
          };
          viewports.bottomLeft = state.viewports.bottomLeft || {
            type: 'front',
            showGrid: true,
            showAxes: true,
            showStats: false,
          };
          viewports.bottomRight = state.viewports.bottomRight || {
            type: 'right',
            showGrid: true,
            showAxes: true,
            showStats: false,
          };
          break;
      }
      
      return {
        layout,
        viewports,
        activeViewport: Object.keys(viewports)[0],
      };
    });
  },

  setViewportType: (id, type) =>
    set((state) => ({
      viewports: {
        ...state.viewports,
        [id]: {
          ...state.viewports[id],
          type,
        },
      },
    })),

  toggleViewportGrid: (id) =>
    set((state) => ({
      viewports: {
        ...state.viewports,
        [id]: {
          ...state.viewports[id],
          showGrid: !state.viewports[id].showGrid,
        },
      },
    })),

  toggleViewportAxes: (id) =>
    set((state) => ({
      viewports: {
        ...state.viewports,
        [id]: {
          ...state.viewports[id],
          showAxes: !state.viewports[id].showAxes,
        },
      },
    })),

  toggleViewportStats: (id) =>
    set((state) => ({
      viewports: {
        ...state.viewports,
        [id]: {
          ...state.viewports[id],
          showStats: !state.viewports[id].showStats,
        },
      },
    })),

  setActiveViewport: (id) =>
    set({ activeViewport: id }),
}));

const ViewportControls: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const {
    layout,
    viewports,
    activeViewport,
    setLayout,
    setViewportType,
    toggleViewportGrid,
    toggleViewportAxes,
    toggleViewportStats,
  } = useViewportStore();

  const handleLayoutClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLayoutClose = () => {
    setAnchorEl(null);
  };

  const handleLayoutChange = (newLayout: ViewportLayout) => {
    setLayout(newLayout);
    handleLayoutClose();
  };

  const actions = [
    {
      icon: <GridIcon />,
      name: 'Toggle Grid',
      action: () => toggleViewportGrid(activeViewport),
    },
    {
      icon: <TimelineIcon />,
      name: 'Toggle Axes',
      action: () => toggleViewportAxes(activeViewport),
    },
    {
      icon: <VisibilityIcon />,
      name: 'Toggle Stats',
      action: () => toggleViewportStats(activeViewport),
    },
  ];

  return (
    <Box sx={{ position: 'absolute', right: 16, bottom: 16 }}>
      <SpeedDial
        ariaLabel="Viewport Controls"
        icon={<CameraIcon />}
        direction="up"
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>

      <Tooltip title="Change Layout">
        <IconButton
          onClick={handleLayoutClick}
          sx={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            backgroundColor: 'background.paper',
          }}
        >
          <ViewQuiltIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleLayoutClose}
      >
        <MenuItem onClick={() => handleLayoutChange('single')}>
          <ViewQuiltIcon sx={{ mr: 1 }} /> Single View
        </MenuItem>
        <MenuItem onClick={() => handleLayoutChange('double')}>
          <ViewAgendaIcon sx={{ mr: 1 }} /> Double View
        </MenuItem>
        <MenuItem onClick={() => handleLayoutChange('triple')}>
          <ViewQuiltIcon sx={{ mr: 1 }} /> Triple View
        </MenuItem>
        <MenuItem onClick={() => handleLayoutChange('quad')}>
          <GridViewIcon sx={{ mr: 1 }} /> Quad View
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ViewportControls;
