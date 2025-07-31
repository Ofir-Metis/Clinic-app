import React, { useEffect, useState, useRef } from 'react';
import {
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
  Stack,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import {
  NoteAdd as NoteAddIcon,
  UploadFile as UploadIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  AttachFile as FileIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  getPatientDetail,
  getPatientSessions,
  getPatientFiles,
  getPatientBilling,
} from '../api/patient';
import WellnessLayout from '../layouts/WellnessLayout';

const PatientDetailPage: React.FC<{ id: number }> = ({ id }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [detail, setDetail] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [billing, setBilling] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (file?: File) => {
    if (file) {
      console.info('upload', file.name);
    }
  };

  const handleFabClick = () => {
    if (tab === 1) {
      navigate(`/patients/${id}/notes/new`);
    } else {
      fileInputRef.current?.click();
    }
  };

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
      <WellnessLayout title="Loading..." showFab={false}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </WellnessLayout>
    );
  }

  return (
    <WellnessLayout
      title={detail ? `${detail.firstName} ${detail.lastName}` : 'Patient Details'}
      showFab={true}
      fabIcon={tab === 1 ? <NoteAddIcon /> : <UploadIcon />}
      fabAction={handleFabClick}
      fabAriaLabel={tab === 1 ? 'Add new note' : 'Upload file'}
    >
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        {/* Patient Profile Card */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            position: { lg: 'sticky' },
            top: { lg: 100 },
            height: 'fit-content',
          }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              {detail && (
                <Stack spacing={3}>
                  <Box>
                    <Avatar 
                      src={detail.avatarUrl} 
                      alt={detail.firstName} 
                      sx={{ 
                        width: 120, 
                        height: 120, 
                        mx: 'auto', 
                        mb: 2,
                        border: '4px solid',
                        borderColor: 'primary.main',
                      }} 
                    >
                      <PersonIcon sx={{ fontSize: 48 }} />
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {`${detail.firstName} ${detail.lastName}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Patient ID: #{detail.id}
                    </Typography>
                  </Box>
                  
                  <Divider />
                  
                  <Stack spacing={2} sx={{ textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <EmailIcon color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body1">{detail.email}</Typography>
                      </Box>
                    </Box>
                    
                    {detail.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PhoneIcon color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Phone</Typography>
                          <Typography variant="body1">{detail.phone}</Typography>
                        </Box>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CalendarIcon color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Member Since</Typography>
                        <Typography variant="body1">
                          {detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                  
                  <Divider />
                  
                  <Stack direction="row" spacing={2}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      onClick={() => navigate(`/patients/${id}/history`)}
                    >
                      View History
                    </Button>
                    <Button 
                      variant="outlined" 
                      fullWidth
                      onClick={() => navigate(`/appointments/new?patient=${id}`)}
                    >
                      Schedule
                    </Button>
                  </Stack>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                aria-label="patient-tabs"
                variant="scrollable"
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  px: 3,
                  '& .MuiTab-root': {
                    minHeight: 64,
                    textTransform: 'none',
                    fontWeight: 600,
                  },
                }}
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssignmentIcon fontSize="small" />
                      {t('overview', 'Overview')}
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon fontSize="small" />
                      {t('sessions', 'Sessions')}
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileIcon fontSize="small" />
                      {t('files', 'Files')}
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentIcon fontSize="small" />
                      {t('billing', 'Billing')}
                    </Box>
                  } 
                />
              </Tabs>
              {/* Overview Tab */}
              {tab === 0 && (
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Patient Overview
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        background: 'linear-gradient(135deg, rgba(46, 125, 107, 0.1), rgba(46, 125, 107, 0.05))',
                        border: '1px solid rgba(46, 125, 107, 0.2)',
                      }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                            {detail?.totalSessions || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('totalSessions', 'Total Sessions')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ 
                        background: 'linear-gradient(135deg, rgba(139, 90, 135, 0.1), rgba(139, 90, 135, 0.05))',
                        border: '1px solid rgba(139, 90, 135, 0.2)',
                      }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="secondary.main" sx={{ fontWeight: 600 }}>
                            {detail?.lastSession
                              ? new Date(detail.lastSession).toLocaleDateString()
                              : 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('lastSession', 'Last Session')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {detail?.status || 'Active'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Status
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {sessions.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Active Plans
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}
              {/* Sessions Tab */}
              {tab === 1 && (
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Recent Sessions ({sessions.length})
                  </Typography>
                  {sessions.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 6,
                      background: 'rgba(46, 125, 107, 0.04)',
                      borderRadius: 2,
                    }}>
                      <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No sessions found for this patient
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {sessions.map((s) => (
                        <Card key={s.id} sx={{ 
                          transition: 'all 0.2s ease',
                          '&:hover': { transform: 'translateY(-1px)', boxShadow: 3 },
                        }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  <CalendarIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {new Date(s.date).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </Typography>
                                  <Chip 
                                    label={s.type} 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                  />
                                </Box>
                              </Box>
                              <IconButton 
                                aria-label={t('viewNote', 'View Note')} 
                                size="small"
                                onClick={() => navigate(`/sessions/${s.id}`)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
              {/* Files Tab */}
              {tab === 2 && (
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Patient Files ({files.length})
                  </Typography>
                  {files.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 6,
                      background: 'rgba(46, 125, 107, 0.04)',
                      borderRadius: 2,
                    }}>
                      <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        No files uploaded yet
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<UploadIcon />}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload First File
                      </Button>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {files.map((f) => (
                        <Card key={f.id} sx={{ 
                          transition: 'all 0.2s ease',
                          '&:hover': { transform: 'translateY(-1px)', boxShadow: 3 },
                        }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                  <FileIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {f.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {f.size ? `${(f.size / 1024).toFixed(1)} KB` : 'Unknown size'} • 
                                    {f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString() : 'Unknown date'}
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton 
                                aria-label={t('download', 'Download')} 
                                href={f.url} 
                                size="small"
                                component="a"
                                target="_blank"
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
              {/* Billing Tab */}
              {tab === 3 && (
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Billing History ({billing.length})
                  </Typography>
                  {billing.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 6,
                      background: 'rgba(46, 125, 107, 0.04)',
                      borderRadius: 2,
                    }}>
                      <PaymentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No billing records found
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {billing.map((b) => (
                        <Card key={b.id} sx={{ 
                          transition: 'all 0.2s ease',
                          '&:hover': { transform: 'translateY(-1px)', boxShadow: 3 },
                        }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'success.main' }}>
                                  <PaymentIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    ${b.amount}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {b.date ? new Date(b.date).toLocaleDateString() : 'No date'}
                                  </Typography>
                                </Box>
                              </Box>
                              <Chip 
                                label={b.status} 
                                color={b.status === 'paid' ? 'success' : b.status === 'pending' ? 'warning' : 'error'}
                                size="small"
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleUpload(e.target.files?.[0])}
      />
    </WellnessLayout>
  );
};

export default PatientDetailPage;
