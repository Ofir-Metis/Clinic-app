import React, { useEffect, useMemo, useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { createAppTheme } from '../theme';
import { fetchNotifications, Notification } from '../api/notifications';

const NotificationsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useMemo(() => createAppTheme(i18n.dir()), [i18n]);
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Avatar sx={{ mr: 2 }}>U</Avatar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {new Date().toLocaleDateString()}
          </Typography>
          <Avatar>A</Avatar>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <List>
            {items.map((n) => (
              <ListItem key={n.id} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar src={n.avatarUrl}>{!n.avatarUrl && 'N'}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={n.message}
                  secondary={new Date(n.date).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default NotificationsPage;
