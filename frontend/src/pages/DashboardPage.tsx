import React, { useEffect, useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Toolbar,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Fab,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import PageAppBar from '../components/PageAppBar';
import AIHelper from '../AIHelper';
import { fetchAppointments, fetchNotes, fetchStats } from '../api/dashboard';

const drawerWidth = 240;

const DashboardPage: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    Promise.all([fetchAppointments(), fetchNotes(), fetchStats()])
      .then(([a, n, s]) => {
        setAppointments(a);
        setNotes(n);
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
        <PageAppBar position="fixed" avatarUrls={[]} />
        <Drawer
          variant="permanent"
          sx={{ width: drawerWidth, [`& .MuiDrawer-paper`]: { width: drawerWidth } }}
        >
          <Toolbar />
          <List>
            {['Dashboard', 'Calendar', 'Clients', 'Notes', 'Files', 'Settings'].map(
              (text) => (
                <ListItem button key={text}>
                  <ListItemText primary={text} />
                </ListItem>
              ),
            )}
          </List>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          {loading ? (
            <CircularProgress />
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Upcoming Appointments</Typography>
                    <List>
                      {appointments.map((a) => (
                        <ListItem key={a.id}>
                          <ListItemText
                            primary={new Date(a.startTime).toLocaleString()}
                            secondary={a.type}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Recent Notes</Typography>
                    <List>
                      {notes.map((n) => (
                        <ListItem key={n.id}>
                          <ListItemText primary={n.content} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Analytics</Typography>
                    {stats && (
                      <>
                        <Typography>Total Clients: {stats.totalClients}</Typography>
                        <Typography>Sessions This Week: {stats.sessionsThisWeek}</Typography>
                        <Typography>Pending Tasks: {stats.pendingTasks}</Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
        {showChat && (
          <Box sx={{ position: 'fixed', bottom: 80, right: 16, width: 300 }}>
            <AIHelper />
          </Box>
        )}
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowChat((v) => !v)}
        >
          <ChatIcon />
        </Fab>
      </Box>
  );
};

export default DashboardPage;
