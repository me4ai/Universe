import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Header from './components/layout/Header';
import Toolbar from './components/toolbar/Toolbar';
import Canvas from './components/3d/Canvas';
import ToolPanel from './components/tools/ToolPanel';
import PropertiesPanel from './components/properties/PropertiesPanel';
import MaterialPanel from './components/materials/MaterialPanel';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Header />
        <Toolbar />
        <Canvas />
        <ToolPanel />
        <PropertiesPanel />
        <MaterialPanel />
      </div>
    </ThemeProvider>
  );
}

export default App;
