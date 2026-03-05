/**
 * GooglePermissionManager - Advanced permission management component
 * Provides detailed control over Google integration permissions and scopes
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Tooltip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Email as EmailIcon,
  VideoCall as VideoCallIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Lock as LockIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface PermissionScope {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  required: boolean;
  enabled: boolean;
  sensitive: boolean;
  details: string[];
}

interface GooglePermissionManagerProps {
  permissions: {
    calendar: boolean;
    email: boolean;
    meet: boolean;
  };
  onPermissionChange: (permission: string, enabled: boolean) => Promise<void>;
  isUpdating?: boolean;
  canModifyPermissions?: boolean;
}

export const GooglePermissionManager: React.FC<GooglePermissionManagerProps> = ({
  permissions,
  onPermissionChange,
  isUpdating = false,
  canModifyPermissions = true
}) => {
  const theme = useTheme();
  const [showScopeDialog, setShowScopeDialog] = useState(false);
  const [selectedScope, setSelectedScope] = useState<PermissionScope | null>(null);
  const [expandedScopes, setExpandedScopes] = useState<string[]>([]);

  const permissionScopes: PermissionScope[] = [
    {
      id: 'calendar',
      name: 'Calendar Access',
      description: 'Manage your Google Calendar events and scheduling',
      icon: <CalendarIcon />,
      required: true,
      enabled: permissions.calendar,
      sensitive: false,
      details: [
        'Create and update calendar events for coaching sessions',
        'Generate Google Meet links for virtual meetings',
        'Set reminders and notifications for appointments',
        'View existing events to prevent scheduling conflicts',
        'Manage event attendees and invitations'
      ]
    },
    {
      id: 'email',
      name: 'Email Access',
      description: 'Send appointment reminders and coaching updates',
      icon: <EmailIcon />,
      required: false,
      enabled: permissions.email,
      sensitive: true,
      details: [
        'Send automated appointment reminder emails',
        'Deliver coaching session summaries and notes',
        'Share progress reports with clients',
        'Send welcome emails and onboarding materials',
        'Notify about schedule changes or cancellations'
      ]
    },
    {
      id: 'meet',
      name: 'Google Meet Access',
      description: 'Create and manage virtual meeting rooms',
      icon: <VideoCallIcon />,
      required: false,
      enabled: permissions.meet,
      sensitive: false,
      details: [
        'Automatically generate Google Meet links',
        'Create virtual rooms for coaching sessions',
        'Manage meeting access and security settings',
        'Record virtual sessions (when enabled)',
        'Share meeting links with clients'
      ]
    }
  ];

  const handlePermissionToggle = async (scopeId: string, enabled: boolean) => {
    try {
      await onPermissionChange(scopeId, enabled);
    } catch (error) {
      console.error(`Failed to update ${scopeId} permission:`, error);
    }
  };

  const handleScopeDetails = (scope: PermissionScope) => {
    setSelectedScope(scope);
    setShowScopeDialog(true);
  };

  const toggleScopeExpansion = (scopeId: string) => {
    setExpandedScopes(prev => 
      prev.includes(scopeId) 
        ? prev.filter(id => id !== scopeId)
        : [...prev, scopeId]
    );
  };

  const getPermissionSummary = () => {
    const enabledCount = Object.values(permissions).filter(Boolean).length;
    const totalCount = Object.keys(permissions).length;
    const requiredEnabled = permissionScopes.filter(scope => scope.required && scope.enabled).length;
    const requiredTotal = permissionScopes.filter(scope => scope.required).length;

    return {
      enabledCount,
      totalCount,
      requiredEnabled,
      requiredTotal,
      isCompliant: requiredEnabled === requiredTotal
    };
  };

  const summary = getPermissionSummary();

  return (
    <Box>
      {/* Permission Summary */}
      <Card
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.85) 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid rgba(255, 255, 255, 0.25)`,
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)',
          mb: 3
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <SecurityIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Permission Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Control what data your coaching app can access from Google
              </Typography>
            </Box>
          </Box>

          {/* Summary Stats */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center"
            sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.02)', 
              borderRadius: 2, 
              p: 2,
              mb: 2
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary.main">
                  {summary.enabledCount}/{summary.totalCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Permissions
                </Typography>
              </Box>
              
              <Box textAlign="center">
                <Typography 
                  variant="h6" 
                  color={summary.isCompliant ? "success.main" : "warning.main"}
                >
                  {summary.requiredEnabled}/{summary.requiredTotal}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Required
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1}>
              {summary.isCompliant ? (
                <Chip 
                  icon={<VerifiedIcon />} 
                  label="Compliant" 
                  color="success" 
                  size="small" 
                />
              ) : (
                <Chip 
                  icon={<WarningIcon />} 
                  label="Missing Required" 
                  color="warning" 
                  size="small" 
                />
              )}
            </Stack>
          </Box>

          {/* Compliance Alert */}
          {!summary.isCompliant && (
            <Alert 
              severity="warning" 
              icon={<WarningIcon />}
              sx={{ mb: 2, borderRadius: 2 }}
            >
              <Typography variant="body2" fontWeight={600}>
                Required permissions missing
              </Typography>
              <Typography variant="body2">
                Calendar access is required for basic coaching app functionality. 
                Please enable required permissions to continue.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Permission List */}
      <Card
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.85) 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid rgba(255, 255, 255, 0.25)`,
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <List>
            {permissionScopes.map((scope, index) => (
              <Box key={scope.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 3,
                    backgroundColor: scope.enabled 
                      ? `${theme.palette.success.main}05` 
                      : 'transparent'
                  }}
                >
                  <ListItemIcon>
                    <Box
                      sx={{
                        color: scope.enabled 
                          ? theme.palette.success.main 
                          : theme.palette.grey[500],
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {React.cloneElement(scope.icon, { fontSize: 'medium' })}
                    </Box>
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight={600}>
                          {scope.name}
                        </Typography>
                        {scope.required && (
                          <Chip 
                            label="Required" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                        {scope.sensitive && (
                          <Tooltip title="This permission accesses sensitive data">
                            <LockIcon 
                              fontSize="small" 
                              color="warning" 
                              sx={{ fontSize: 16 }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          {scope.description}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => handleScopeDetails(scope)}
                          sx={{ textTransform: 'none', p: 0, minHeight: 'auto' }}
                        >
                          View detailed permissions
                        </Button>
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <Box display="flex" alignItems="center" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => toggleScopeExpansion(scope.id)}
                      >
                        {expandedScopes.includes(scope.id) ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={scope.enabled}
                            onChange={(e) => handlePermissionToggle(scope.id, e.target.checked)}
                            disabled={!canModifyPermissions || isUpdating}
                            color="primary"
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>

                {/* Expanded Details */}
                <Collapse in={expandedScopes.includes(scope.id)}>
                  <Box sx={{ px: 3, pb: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                    <Typography variant="body2" fontWeight={500} mb={1}>
                      What this permission allows:
                    </Typography>
                    <List dense>
                      {scope.details.map((detail, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5, pl: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            • {detail}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Collapse>

                {index < permissionScopes.length - 1 && (
                  <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }} />
                )}
              </Box>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Scope Details Dialog */}
      <Dialog
        open={showScopeDialog}
        onClose={() => setShowScopeDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.95) 100%)`,
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {selectedScope?.icon && React.cloneElement(selectedScope.icon, { color: 'primary' })}
            <Box>
              <Typography variant="h6">{selectedScope?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Detailed permission breakdown
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedScope && (
            <Stack spacing={3}>
              <Alert 
                severity={selectedScope.sensitive ? 'warning' : 'info'} 
                icon={<InfoIcon />}
                sx={{ borderRadius: 2 }}
              >
                <Typography variant="body2">
                  {selectedScope.sensitive 
                    ? 'This permission accesses sensitive personal data. We use encryption and follow strict privacy policies to protect your information.'
                    : 'This permission helps improve your coaching experience by connecting with Google services.'
                  }
                </Typography>
              </Alert>

              <Box>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  What we can do with this permission:
                </Typography>
                <List>
                  {selectedScope.details.map((detail, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.primary.main,
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            {detail}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Your data is protected
                </Typography>
                <Typography variant="body2">
                  • We never share your data with third parties
                  • All communications are encrypted
                  • You can revoke permissions at any time
                  • Data is stored securely with enterprise-grade protection
                </Typography>
              </Alert>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowScopeDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};