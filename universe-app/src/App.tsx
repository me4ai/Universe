import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import Canvas from './components/3d/Canvas';
import ToolPanel from './components/tools/ToolPanel';
import PropertiesPanel from './components/properties/PropertiesPanel';
import MaterialPanel from './components/materials/MaterialPanel';
import HierarchyPanel from './components/hierarchy/HierarchyPanel';
import Toolbar from './components/toolbar/Toolbar';
import ViewportControls from './components/3d/ViewportControls';
import ShortcutsDialog from './components/dialogs/ShortcutsDialog';
import { useShortcuts } from './utils/shortcuts';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { LoginButton } from './components/auth/LoginButton';
import { UserProfile } from './components/auth/UserProfile';
import { RoleBasedRoute } from './components/auth/RoleBasedRoute';
import { UnauthorizedPage } from './components/pages/UnauthorizedPage';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { AppBar, Typography } from '@mui/material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);

  // Initialize keyboard shortcuts
  useShortcuts();

  // Handle keyboard shortcut for shortcuts dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && event.shiftKey) {
        setShortcutsDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Box sx={{ flexGrow: 1 }}>
              <AppBar position="static">
                <Toolbar>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Universe App
                  </Typography>
                  <LoginButton />
                  <UserProfile />
                </Toolbar>
              </AppBar>
              
              <Routes>
                <Route path="/login" element={<LoginButton />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route
                  path="/"
                  element={
                    <RoleBasedRoute>
                      <Box sx={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
                        <Toolbar onShortcutsClick={() => setShortcutsDialogOpen(true)} />
                        <ToolPanel />
                        <PropertiesPanel />
                        <MaterialPanel />
                        <HierarchyPanel />
                        <ViewportControls />
                        <Canvas />
                      </Box>
                      
                      <ShortcutsDialog
                        open={shortcutsDialogOpen}
                        onClose={() => setShortcutsDialogOpen(false)}
                      />
                    </RoleBasedRoute>
                  }
                />
                
                {/* Admin routes */}
                <Route
                  path="/admin/*"
                  element={
                    <RoleBasedRoute requiredRoles={['admin']}>
                      {/* Admin panel components would go here */}
                      <div>Admin Panel</div>
                    </RoleBasedRoute>
                  }
                />
                
                {/* Editor routes */}
                <Route
                  path="/editor/*"
                  element={
                    <RoleBasedRoute requiredRoles={['editor', 'admin']}>
                      {/* Editor specific components would go here */}
                      <div>Editor Panel</div>
                    </RoleBasedRoute>
                  }
                />
              </Routes>
            </Box>
          </ThemeProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
