/**
 * ViewSwitchingBanner - Banner to indicate when therapist is viewing as client
 */

import React from 'react';
import {
  Box,
  Alert,
  Button,
  Typography,
  Chip,
  Avatar,
  Slide,
} from '@mui/material';
import {
  Person as PersonIcon,
  ExitToApp as ExitIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useViewSwitching } from '../hooks/useViewSwitching';

const ViewSwitchingBanner: React.FC = () => {
  const { isImpersonating, currentView, exitImpersonation, loading } = useViewSwitching();

  if (!isImpersonating) {
    return null;
  }

  return (
    <Slide direction="down" in={isImpersonating} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          background: 'linear-gradient(135deg, #F4A261 0%, #E8934A 100%)',
          boxShadow: '0 4px 20px rgba(244, 162, 97, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Alert
          severity="warning"
          icon={<ViewIcon />}
          sx={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white',
            },
            '& .MuiAlert-message': {
              width: '100%',
            },
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={exitImpersonation}
              disabled={loading}
              startIcon={<ExitIcon />}
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              variant="outlined"
            >
              Exit Client View
            </Button>
          }
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  width: 24,
                  height: 24,
                }}
              >
                <PersonIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Client View Mode
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2">
                You are viewing the app as:
              </Typography>
              <Chip
                label={currentView.viewingAsClientName || 'Client'}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                  '& .MuiChip-label': {
                    paddingX: 1,
                  },
                }}
              />
            </Box>

            <Typography
              variant="caption"
              sx={{
                opacity: 0.9,
                fontStyle: 'italic',
              }}
            >
              All actions and data reflect the client's perspective
            </Typography>
          </Box>
        </Alert>
      </Box>
    </Slide>
  );
};

export default ViewSwitchingBanner;