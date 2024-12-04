import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { getShortcutsList } from '../../utils/shortcuts';

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({ open, onClose }) => {
  const shortcuts = getShortcutsList();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Keyboard Shortcuts
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <List>
          {shortcuts.map((shortcut, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={
                  <Typography variant="body1" component="span">
                    {shortcut.description}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      backgroundColor: 'action.hover',
                      padding: '2px 6px',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                    }}
                  >
                    {shortcut.key}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsDialog;
