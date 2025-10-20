import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  InputAdornment,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Psychology as ToolsIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactElement;
  action: () => void;
  category: 'navigation' | 'actions' | 'patients';
  keywords: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();

  // Define available commands
  const commands: CommandAction[] = useMemo(() => [
    // Navigation commands
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View your wellness dashboard',
      icon: <DashboardIcon />,
      action: () => navigate('/dashboard'),
      category: 'navigation',
      keywords: ['dashboard', 'home', 'overview'],
    },
    {
      id: 'nav-clients',
      label: 'Go to Clients',
      description: 'Manage your client relationships',
      icon: <PeopleIcon />,
      action: () => navigate('/patients'),
      category: 'navigation',
      keywords: ['clients', 'patients', 'people'],
    },
    {
      id: 'nav-calendar',
      label: 'Go to Calendar',
      description: 'View and manage appointments',
      icon: <CalendarIcon />,
      action: () => navigate('/calendar'),
      category: 'navigation',
      keywords: ['calendar', 'schedule', 'appointments'],
    },
    {
      id: 'nav-tools',
      label: 'Go to AI Tools',
      description: 'Access AI-powered wellness tools',
      icon: <ToolsIcon />,
      action: () => navigate('/tools'),
      category: 'navigation',
      keywords: ['ai', 'tools', 'artificial intelligence'],
    },
    {
      id: 'nav-notifications',
      label: 'Go to Notifications',
      description: 'Check your notifications',
      icon: <NotificationsIcon />,
      action: () => navigate('/notifications'),
      category: 'navigation',
      keywords: ['notifications', 'alerts', 'messages'],
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Configure your preferences',
      icon: <SettingsIcon />,
      action: () => navigate('/settings'),
      category: 'navigation',
      keywords: ['settings', 'preferences', 'config'],
    },

    // Action commands
    {
      id: 'action-new-client',
      label: 'Add New Client',
      description: 'Create a new client profile',
      icon: <AddIcon />,
      action: () => navigate('/patients/new'),
      category: 'actions',
      keywords: ['add', 'new', 'create', 'client', 'patient'],
    },
    {
      id: 'action-new-appointment',
      label: 'Schedule Appointment',
      description: 'Create a new appointment',
      icon: <EventIcon />,
      action: () => navigate('/appointments/new'),
      category: 'actions',
      keywords: ['schedule', 'appointment', 'session', 'booking'],
    },
    {
      id: 'action-profile',
      label: 'View Profile',
      description: 'View your profile settings',
      icon: <PersonIcon />,
      action: () => navigate('/profile'),
      category: 'actions',
      keywords: ['profile', 'account', 'me', 'user'],
    },
  ], [navigate]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const searchQuery = query.toLowerCase();
    return commands.filter(command =>
      command.label.toLowerCase().includes(searchQuery) ||
      command.description?.toLowerCase().includes(searchQuery) ||
      command.keywords.some(keyword => keyword.includes(searchQuery))
    );
  }, [commands, query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            handleClose();
          }
          break;
        case 'Escape':
          event.preventDefault();
          handleClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filteredCommands]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(prev => Math.min(prev, Math.max(0, filteredCommands.length - 1)));
  }, [filteredCommands.length]);

  const handleClose = () => {
    setQuery('');
    setSelectedIndex(0);
    onClose();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'navigation':
        return theme.palette.primary.main;
      case 'actions':
        return theme.palette.secondary.main;
      case 'patients':
        return theme.palette.success.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'navigation':
        return 'Navigate';
      case 'actions':
        return 'Actions';
      case 'patients':
        return 'Patients';
      default:
        return '';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: alpha(theme.palette.common.black, 0.3),
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Search Input */}
        <Box sx={{ p: 3, pb: 0 }}>
          <TextField
            fullWidth
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.divider, 0.2),
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Box>

        {/* Command List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto', p: 1 }}>
          {filteredCommands.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No commands found
              </Typography>
            </Box>
          ) : (
            <List dense>
              {filteredCommands.map((command, index) => (
                <ListItemButton
                  key={command.id}
                  selected={index === selectedIndex}
                  onClick={() => {
                    command.action();
                    handleClose();
                  }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    mx: 1,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                      },
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.5),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box sx={{ color: getCategoryColor(command.category) }}>
                      {command.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {command.label}
                        </Typography>
                        <Chip
                          label={getCategoryLabel(command.category)}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            backgroundColor: alpha(getCategoryColor(command.category), 0.1),
                            color: getCategoryColor(command.category),
                            border: 'none',
                          }}
                        />
                      </Box>
                    }
                    secondary={command.description}
                    sx={{
                      '& .MuiListItemText-secondary': {
                        fontSize: '0.75rem',
                        color: theme.palette.text.secondary,
                      },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>

        {/* Footer with shortcuts */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.default, 0.5),
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;