import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import { LogoutOutlined as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LogoutButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  iconOnly?: boolean;
  showConfirmDialog?: boolean;
  onLogoutComplete?: () => void;
}

/**
 * Logout button component with optional confirmation dialog
 */
const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'text',
  size = 'medium',
  iconOnly = false,
  showConfirmDialog = true,
  onLogoutComplete,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    if (showConfirmDialog && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsLoggingOut(true);
    setShowConfirm(false);

    try {
      await logout();
      navigate('/login', { replace: true });
      onLogoutComplete?.();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to login even if server logout fails
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (iconOnly) {
    return (
      <>
        <Tooltip title="Sign Out">
          <IconButton
            onClick={handleLogout}
            disabled={isLoggingOut}
            size={size}
            color="inherit"
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>

        {showConfirmDialog && (
          <Dialog
            open={showConfirm}
            onClose={handleCancel}
            aria-labelledby="logout-dialog-title"
          >
            <DialogTitle id="logout-dialog-title">
              Sign Out
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to sign out? Any unsaved changes will be lost.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancel} color="primary">
                Cancel
              </Button>
              <Button 
                onClick={handleLogout} 
                color="error"
                variant="contained"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleLogout}
        disabled={isLoggingOut}
        variant={variant}
        size={size}
        startIcon={<LogoutIcon />}
        color="inherit"
      >
        {isLoggingOut ? 'Signing out...' : 'Sign Out'}
      </Button>

      {showConfirmDialog && (
        <Dialog
          open={showConfirm}
          onClose={handleCancel}
          aria-labelledby="logout-dialog-title"
        >
          <DialogTitle id="logout-dialog-title">
            Sign Out
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to sign out? Any unsaved changes will be lost.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleLogout} 
              color="error"
              variant="contained"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default LogoutButton;