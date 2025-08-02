/**
 * ViewSwitchingButton - UI component for therapists to switch between therapist and client views
 */

import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Typography,
  Chip,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  SwapHoriz as SwitchIcon,
  Person as PersonIcon,
  Psychology as TherapistIcon,
  ExitToApp as ExitIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useViewSwitching } from '../hooks/useViewSwitching';

interface ClientOption {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastActive?: string;
}

const ViewSwitchingButton: React.FC = () => {
  const { user } = useAuth();
  const {
    isImpersonating,
    currentView,
    accessibleClients,
    loading,
    error,
    switchToClient,
    exitImpersonation,
    loadAccessibleClients,
  } = useViewSwitching();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    if (!isImpersonating && accessibleClients.length === 0) {
      loadAccessibleClients();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSwitchingTo(null);
  };

  const handleSwitchToClient = async (client: ClientOption) => {
    setSwitchingTo(client.id);
    try {
      await switchToClient(client.id);
      handleClose();
    } catch (error) {
      console.error('Failed to switch to client view:', error);
      setSwitchingTo(null);
    }
  };

  const handleExitImpersonation = async () => {
    setSwitchingTo('exit');
    try {
      await exitImpersonation();
      handleClose();
    } catch (error) {
      console.error('Failed to exit client view:', error);
      setSwitchingTo(null);
    }
  };

  // Only show for therapists/coaches
  if (user?.role !== 'coach' && user?.role !== 'admin') {
    return null;
  }

  const buttonContent = isImpersonating ? (
    <>
      <PersonIcon sx={{ mr: 1 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Typography variant="button" sx={{ lineHeight: 1 }}>
          Client View
        </Typography>
        <Typography variant="caption" sx={{ lineHeight: 1, opacity: 0.7 }}>
          {currentView?.viewingAsClientName || 'Viewing as client'}
        </Typography>
      </Box>
      <Chip
        label="Impersonating"
        size="small"
        color="warning"
        sx={{ ml: 1, fontSize: '0.6rem', height: 20 }}
      />
    </>
  ) : (
    <>
      <TherapistIcon sx={{ mr: 1 }} />
      <Typography variant="button">Switch View</Typography>
    </>
  );

  return (
    <>
      <Button
        variant={isImpersonating ? "contained" : "outlined"}
        color={isImpersonating ? "warning" : "primary"}
        onClick={handleClick}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} /> : <SwitchIcon />}
        sx={{
          borderRadius: 3,
          px: 2,
          py: 1,
          minWidth: isImpersonating ? 200 : 140,
          justifyContent: 'flex-start',
          textTransform: 'none',
          background: isImpersonating 
            ? 'linear-gradient(135deg, #F4A261 0%, #E8934A 100%)'
            : undefined,
          boxShadow: isImpersonating 
            ? '0 4px 16px rgba(244, 162, 97, 0.3)'
            : undefined,
          '&:hover': {
            background: isImpersonating 
              ? 'linear-gradient(135deg, #E8934A 0%, #D17935 100%)'
              : undefined,
            transform: 'translateY(-1px)',
            boxShadow: isImpersonating 
              ? '0 6px 20px rgba(244, 162, 97, 0.4)'
              : '0 4px 12px rgba(46, 125, 107, 0.2)',
          },
        }}
      >
        {buttonContent}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: 3,
            mt: 1,
            minWidth: 300,
            maxWidth: 400,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            '& .MuiMenuItem-root': {
              borderRadius: 2,
              mx: 1,
              my: 0.5,
            },
          },
        }}
      >
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </Box>
        )}

        {isImpersonating ? (
          <>
            <MenuItem disabled>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Currently in Client View"
                secondary={`Viewing as: ${currentView?.viewingAsClientName || 'Client'}`}
              />
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem
              onClick={handleExitImpersonation}
              disabled={switchingTo === 'exit'}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {switchingTo === 'exit' ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <ExitIcon />
                  )}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Return to Therapist View"
                secondary="Exit client view mode"
              />
            </MenuItem>
          </>
        ) : (
          <>
            <Box sx={{ p: 2, pb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Switch to Client View
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                View the app from your client's perspective
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            
            {loading ? (
              <MenuItem disabled>
                <ListItemAvatar>
                  <CircularProgress size={32} />
                </ListItemAvatar>
                <ListItemText primary="Loading clients..." />
              </MenuItem>
            ) : accessibleClients.length === 0 ? (
              <MenuItem disabled>
                <ListItemText 
                  primary="No clients available"
                  secondary="No clients assigned for view switching"
                />
              </MenuItem>
            ) : (
              accessibleClients.map((client) => (
                <MenuItem
                  key={client.id}
                  onClick={() => handleSwitchToClient(client)}
                  disabled={switchingTo === client.id}
                >
                  <ListItemAvatar>
                    {switchingTo === client.id ? (
                      <CircularProgress size={32} />
                    ) : (
                      <Avatar
                        src={client.avatar}
                        sx={{ bgcolor: 'primary.light' }}
                      >
                        {client.name.charAt(0)}
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={client.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {client.email}
                        </Typography>
                        {client.lastActive && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Last active: {new Date(client.lastActive).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </MenuItem>
              ))
            )}
          </>
        )}
      </Menu>
    </>
  );
};

export default ViewSwitchingButton;