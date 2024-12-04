import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  PersonAdd as JoinIcon,
  ExitToApp as LeaveIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';
import { useCollaborationStore } from '../../store/collaborationStore';

const CollaborationPanel: React.FC = () => {
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    connected,
    users,
    currentUserId,
    messages,
    connect,
    disconnect,
    sendMessage,
    updatePresence,
  } = useCollaborationStore();

  useEffect(() => {
    const interval = setInterval(() => {
      if (connected) {
        updatePresence();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [connected, updatePresence]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = async () => {
    if (roomId && userName) {
      await connect(roomId, userName);
      setJoinDialogOpen(false);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Collaboration
        </Typography>
        {!connected ? (
          <Button
            startIcon={<JoinIcon />}
            variant="contained"
            onClick={() => setJoinDialogOpen(true)}
          >
            Join Room
          </Button>
        ) : (
          <Button startIcon={<LeaveIcon />} variant="outlined" onClick={disconnect}>
            Leave Room
          </Button>
        )}
      </Box>

      {connected && (
        <>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Active Users
            </Typography>
            <List dense>
              {Object.values(users).map((user) => (
                <ListItem
                  key={user.id}
                  secondaryAction={
                    user.id === currentUserId && (
                      <Tooltip title="Follow Camera">
                        <IconButton edge="end" size="small">
                          <CameraIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Badge
                      variant="dot"
                      color="success"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: user.color,
                        }}
                      >
                        {user.name[0].toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={user.id === currentUserId ? '(You)' : null}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <List>
              {messages.map((msg) => (
                <ListItem
                  key={msg.id}
                  sx={{
                    flexDirection: 'column',
                    alignItems: msg.userId === currentUserId ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.type === 'system' ? (
                    <Typography variant="caption" color="text.secondary">
                      {msg.content}
                    </Typography>
                  ) : (
                    <>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 0.5,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            mr: 1,
                            bgcolor: users[msg.userId]?.color,
                          }}
                        >
                          {users[msg.userId]?.name[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          {users[msg.userId]?.name} • {formatTimestamp(msg.timestamp)}
                        </Typography>
                      </Box>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1,
                          maxWidth: '80%',
                          bgcolor: msg.userId === currentUserId ? 'primary.main' : 'background.paper',
                          color: msg.userId === currentUserId ? 'primary.contrastText' : 'text.primary',
                        }}
                      >
                        <Typography variant="body2">{msg.content}</Typography>
                      </Paper>
                    </>
                  )}
                </ListItem>
              ))}
              <div ref={chatEndRef} />
            </List>
          </Box>

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSendMessage} disabled={!message.trim()}>
                    <SendIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>
        </>
      )}

      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)}>
        <DialogTitle>Join Collaboration Room</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Room ID"
            fullWidth
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Your Name"
            fullWidth
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleJoin} disabled={!roomId || !userName}>
            Join
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CollaborationPanel;
