import React, { useEffect, useMemo, useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Grid,
  Avatar,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Fab,
  useMediaQuery,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import UploadIcon from '@mui/icons-material/UploadFile';
import { useTranslation } from 'react-i18next';
import {
  getPatientDetail,
  getPatientSessions,
  getPatientFiles,
  getPatientBilling,
} from '../api/patient';

const PatientDetailPage: React.FC<{ id: number }> = ({ id }) => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState(0);
  const [detail, setDetail] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [billing, setBilling] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMobile = useMediaQuery('(max-width:600px)');

  const theme = useMemo(
    () =>
      createTheme({
        direction: i18n.dir(),
        palette: { primary: { main: '#00A699' }, background: { default: '#F5F5F5' } },
        typography: { fontFamily: 'Roboto' },
      }),
    [i18n],
  );

  useEffect(() => {
    setLoading(true);
    getPatientDetail(id)
      .then((d) => {
        setDetail(d);
        setError('');
      })
      .catch(() => setError('error'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === 1) {
      getPatientSessions(id, 1, 20).then(setSessions).catch(() => setError('error'));
    } else if (tab === 2) {
      getPatientFiles(id).then(setFiles).catch(() => setError('error'));
    } else if (tab === 3) {
      getPatientBilling(id).then(setBilling).catch(() => setError('error'));
    }
  }, [tab, id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="back" href="/patients">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {detail ? `${detail.firstName} ${detail.lastName}` : ''}
          </Typography>
          {detail && <Avatar src={detail.avatarUrl} alt={detail.firstName} />}
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Grid container spacing={2} direction={isMobile ? 'column' : 'row'}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                {detail && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar src={detail.avatarUrl} alt={detail.firstName} sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }} />
                    <Typography variant="h6">{`${detail.firstName} ${detail.lastName}`}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {detail.email}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={9}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              aria-label="patient-tabs"
              variant="scrollable"
            >
              <Tab label={t('overview')} />
              <Tab label={t('sessions')} />
              <Tab label={t('files')} />
              <Tab label={t('billing')} />
            </Tabs>
            {tab === 0 && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          {t('totalSessions')}
                        </Typography>
                        <Typography variant="h6">{detail.totalSessions || 0}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          {t('lastSession')}
                        </Typography>
                        <Typography variant="h6">
                          {detail.lastSession
                            ? new Date(detail.lastSession).toLocaleDateString()
                            : '-'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
            {tab === 1 && (
              <Box sx={{ mt: 2 }}>
                {sessions.map((s) => (
                  <Card key={s.id} sx={{ mb: 1 }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{new Date(s.date).toLocaleDateString()}</Typography>
                      <Typography>{s.type}</Typography>
                      <IconButton aria-label={t('viewNote')} size="small">
                        ↗
                      </IconButton>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
            {tab === 2 && (
              <Box sx={{ mt: 2 }}>
                {files.map((f) => (
                  <Card key={f.id} sx={{ mb: 1 }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{f.name}</Typography>
                      <IconButton aria-label={t('download')} href={f.url} size="small">
                        ↗
                      </IconButton>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
            {tab === 3 && (
              <Box sx={{ mt: 2 }}>
                {billing.map((b) => (
                  <Card key={b.id} sx={{ mb: 1 }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{b.amount}</Typography>
                      <Typography>{b.status}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
      <Fab
        color="primary"
        aria-label="actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        {tab === 1 ? <NoteAddIcon /> : <UploadIcon />}
      </Fab>
    </ThemeProvider>
  );
};

export default PatientDetailPage;
