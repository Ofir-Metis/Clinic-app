import React, { useEffect, useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Typography,
  Avatar,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { fetchNotifications, Notification } from '../api/notifications';
import WellnessLayout from '../layouts/WellnessLayout';

const NotificationsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications()
      .then((data) => {
        setItems(data);
        setError('');
      })
      .catch(() => setError('failed'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <WellnessLayout
        title="Notifications"
        showFab={false}
      >
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              mb: 1,
              background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🔔 Notifications
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Stay updated with your wellness journey and client interactions
          </Typography>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Card>
            <CardContent>
              <Typography color="error" textAlign="center">{error}</Typography>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You're all caught up! New notifications will appear here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {items.map((n) => (
              <Card key={n.id} sx={{ 
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: theme => `0 4px 12px ${theme.palette.primary.main}20`,
                },
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar 
                      src={n.avatarUrl}
                      sx={{ 
                        bgcolor: 'primary.main',
                        width: 48,
                        height: 48,
                      }}
                    >
                      {!n.avatarUrl && 'N'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {n.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label="New" 
                            color="primary" 
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(n.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </WellnessLayout>
  );
};

export default NotificationsPage;
