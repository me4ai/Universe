import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Avatar,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from './AuthProvider';

interface UserProfileData {
  nickname: string;
  picture: string;
  email: string;
  bio: string;
  preferences: {
    theme: string;
    notifications: boolean;
  };
}

export const UserProfileManager: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { user, isLoading } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<UserProfileData>({
    nickname: user?.nickname || '',
    picture: user?.picture || '',
    email: user?.email || '',
    bio: user?.user_metadata?.bio || '',
    preferences: user?.user_metadata?.preferences || {
      theme: 'dark',
      notifications: true
    }
  });

  const handleInputChange = (field: keyof UserProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      // Call Auth0 Management API to update user metadata
      // This would require proper backend implementation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3} py={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={profileData.picture}
              alt={profileData.nickname}
              sx={{ width: 64, height: 64 }}
            />
            <Typography variant="body1">
              {profileData.email}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Nickname"
            value={profileData.nickname}
            onChange={(e) => handleInputChange('nickname', e.target.value)}
            fullWidth
          />

          <TextField
            label="Bio"
            value={profileData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            multiline
            rows={4}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isUpdating}
        >
          {isUpdating ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
