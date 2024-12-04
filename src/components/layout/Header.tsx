import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Universe App
        </Typography>
        <Box>
          <Button color="inherit">Login</Button>
          <Button color="inherit">Sign Up</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
