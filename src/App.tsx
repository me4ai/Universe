import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Header from './components/layout/Header';
import Canvas from './components/3d/Canvas';
import ToolPanel from './components/tools/ToolPanel';

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
        <Canvas />
        <ToolPanel />
      </div>
    </ThemeProvider>
  );
}

export default App;
