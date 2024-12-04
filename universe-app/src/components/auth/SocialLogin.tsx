import React from 'react';
import { Button, Stack, Divider, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useAuth } from './AuthProvider';
import { auth0Config } from '../../config/auth0-config';

export const SocialLogin: React.FC = () => {
  const { loginWithSocial } = useAuth();

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: <GoogleIcon />,
      color: '#DB4437'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <GitHubIcon />,
      color: '#333'
    }
  ];

  return (
    <Stack spacing={2} sx={{ width: '100%', mt: 2 }}>
      <Divider>
        <Typography color="text.secondary" variant="body2">
          OR CONTINUE WITH
        </Typography>
      </Divider>
      
      {socialProviders.map((provider) => (
        <Button
          key={provider.id}
          variant="outlined"
          startIcon={provider.icon}
          onClick={() => loginWithSocial(provider.id)}
          sx={{
            borderColor: provider.color,
            color: provider.color,
            '&:hover': {
              borderColor: provider.color,
              backgroundColor: `${provider.color}10`
            }
          }}
        >
          Continue with {provider.name}
        </Button>
      ))}
    </Stack>
  );
};
