import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, Stack, TextField, DialogActions } from '@mui/material';
import { useAuth } from './AuthProvider';
import LoginIcon from '@mui/icons-material/Login';
import { SocialLogin } from './SocialLogin';

export const LoginButton: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) {
    return null;
  }

  const handleLogin = () => {
    login({
      email,
      password,
    });
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpen(true)}
        startIcon={<LoginIcon />}
      >
        Log In
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log In</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
            <SocialLogin />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleLogin} variant="contained">
            Log In
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
