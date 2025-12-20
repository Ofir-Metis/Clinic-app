import React, { useState, useEffect, useMemo } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Typography,
  TextField,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Button,
  Chip,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { List } from 'react-window';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  Notes as NotesIcon,
  VideoCall as VideoCallIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTranslation } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';
import WellnessLayout from '../layouts/WellnessLayout';
import useSwipeGestures from '../hooks/useSwipeGestures';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'on-hold';
  lastSession?: Date;
  upcomingAppointment?: Date;
  totalSessions: number;
  focusArea?: string;
  notes?: string;
}

// Removed mock data - will fetch from API instead

const PatientListPage: React.FC = () => {
  const { translations: t } = useTranslation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Debounce search input for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchDebounced(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Filter patients based on search and status with memoization
  const filteredPatients = useMemo(() => {
    let filtered = patients;

    // Apply search filter with debouncing
    if (searchDebounced) {
      const searchLower = searchDebounced.toLowerCase();
      filtered = filtered.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchLower) ||
        patient.email.toLowerCase().includes(searchLower) ||
        patient.focusArea?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    return filtered;
  }, [patients, searchDebounced, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'on-hold': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'on-hold': return 'On Hold';
      default: return status;
    }
  };

  const handlePatientMenuOpen = (event: React.MouseEvent<HTMLElement>, patient: Patient) => {
    setAnchorEl(event.currentTarget);
    setSelectedPatient(patient);
  };

  const handlePatientMenuClose = () => {
    setAnchorEl(null);
    setSelectedPatient(null);
  };

  const handleDeletePatient = () => {
    if (selectedPatient) {
      setPatients(prev => prev.filter(p => p.id !== selectedPatient.id));
      setOpenDeleteDialog(false);
      handlePatientMenuClose();
    }
  };

  const handleScheduleSession = (patientId: string) => {
    navigate(`/calendar?patient=${patientId}`);
  };

  const handleAddPatient = () => {
    navigate('/patients/new');
  };

  // Virtual list item renderer with swipe gestures
  const VirtualizedPatientCard = ({ index, style, ariaAttributes }: {
    index: number;
    style: React.CSSProperties;
    ariaAttributes: {
      "aria-posinset": number;
      "aria-setsize": number;
      role: "listitem";
    };
  }) => {
    const patient = filteredPatients[index];
    if (!patient) return null;

    // Swipe gesture configuration
    const swipeHandlers = useSwipeGestures({
      leftAction: {
        icon: '📞',
        label: 'Call',
        color: '#2E7D6B',
        background: 'rgba(46, 125, 107, 0.1)',
        action: () => {
          // Handle call action
          console.log(`Calling ${patient.firstName} ${patient.lastName}`);
          // You could open a call dialog or integrate with phone system
        },
      },
      rightAction: {
        icon: '📅',
        label: 'Schedule',
        color: '#4A9B8A',
        background: 'rgba(74, 155, 138, 0.1)',
        action: () => {
          handleScheduleSession(patient.id);
        },
      },
      threshold: 100,
    });

    return (
      <div style={style}>
        <Box sx={{ p: 1 }}>
          <div {...swipeHandlers}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme => `0 8px 24px ${theme.palette.primary.main}20`,
                },
              }}
              onClick={() => navigate(`/patients/${patient.id}`)}
              {...ariaAttributes}
            >
            <CardContent sx={{ p: 3 }}>
              {/* Header with Avatar and Menu */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={patient.avatarUrl}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: 'primary.main',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                    }}
                  >
                    {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {patient.firstName} {patient.lastName}
                    </Typography>
                    <Chip
                      label={getStatusLabel(patient.status)}
                      color={getStatusColor(patient.status) as any}
                      size="small"
                    />
                  </Box>
                </Box>

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePatientMenuOpen(e, patient);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Patient Details */}
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {patient.email}
                  </Typography>
                </Box>

                {patient.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {patient.phone}
                    </Typography>
                  </Box>
                )}

                {patient.focusArea && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotesIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {patient.focusArea}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.clientsPage.totalSessions}
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {patient.totalSessions}
                    </Typography>
                  </Box>

                  {patient.lastSession && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t.clientsPage.lastSession}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {patient.lastSession.toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {patient.upcomingAppointment && (
                  <Box sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: 1,
                    background: 'rgba(46, 125, 107, 0.08)',
                    border: '1px solid rgba(46, 125, 107, 0.12)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight={500}>
                        {t.clientsPage.next} {patient.upcomingAppointment.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<EventIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScheduleSession(patient.id);
                  }}
                  sx={{ flex: 1 }}
                >
                  {t.clientsPage.schedule}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<VideoCallIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle video call
                  }}
                  sx={{ flex: 1 }}
                >
                  {t.clientsPage.call}
                </Button>
              </Box>
            </CardContent>
          </Card>
          </div>
        </Box>
      </div>
    );
  };

  return (
    <WellnessLayout
        title={t.nav.patients}
        showFab={true}
        fabIcon={<AddIcon />}
        fabAction={handleAddPatient}
        fabAriaLabel={t.clientsPage.addNewClient}
      >
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            component="h1"
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
            👥 {t.nav.patients}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t.clientsPage.subtitle}
          </Typography>

          {/* Search and Filter Controls */}
          <Box sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { sm: 'center' },
            mb: 3,
          }}>
            <TextField
              placeholder={t.clientsPage.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, maxWidth: { sm: 400 } }}
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setStatusFilter('all')}
              >
                {t.clientsPage.filterAll} ({patients.length})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setStatusFilter('active')}
              >
                {t.clientsPage.filterActive} ({patients.filter(p => p.status === 'active').length})
              </Button>
              <Button
                variant={statusFilter === 'on-hold' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setStatusFilter('on-hold')}
              >
                {t.clientsPage.filterOnHold} ({patients.filter(p => p.status === 'on-hold').length})
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!loading && filteredPatients.length === 0 && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {searchQuery ? t.clientsPage.noClientsFound : t.clientsPage.noClients}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchQuery
                  ? t.clientsPage.adjustSearchCriteria
                  : t.clientsPage.noClientsMessage
                }
              </Typography>
              {!searchQuery && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddPatient}
                >
                  {t.clientsPage.addFirstClient}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Virtualized Clients List */}
        {!loading && filteredPatients.length > 0 && (
          <Box sx={{ height: 'calc(100vh - 400px)', minHeight: 600 }}>
            <List
              defaultHeight={Math.min(window.innerHeight - 400, 600)}
              rowCount={filteredPatients.length}
              rowHeight={280} // Approximate height of each card
              rowComponent={VirtualizedPatientCard}
            />
          </Box>
        )}

        {/* Patient Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handlePatientMenuClose}
        >
          <MenuItem onClick={() => {
            navigate(`/patients/${selectedPatient?.id}`);
            handlePatientMenuClose();
          }}>
            <PersonIcon sx={{ mr: 1 }} fontSize="small" />
            {t.clientsPage.viewProfile}
          </MenuItem>
          <MenuItem onClick={() => {
            navigate(`/patients/${selectedPatient?.id}/edit`);
            handlePatientMenuClose();
          }}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            {t.clientsPage.editDetails}
          </MenuItem>
          <MenuItem onClick={() => {
            handleScheduleSession(selectedPatient?.id || '');
            handlePatientMenuClose();
          }}>
            <EventIcon sx={{ mr: 1 }} fontSize="small" />
            {t.clientsPage.scheduleSession}
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              setOpenDeleteDialog(true);
              handlePatientMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            {t.clientsPage.removeClient}
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="sm"
        >
          <DialogTitle>{t.clientsPage.removeClientTitle}</DialogTitle>
          <DialogContent>
            <Typography>
              {t.clientsPage.removeClientConfirm
                .replace('{name}', `${selectedPatient?.firstName} ${selectedPatient?.lastName}`)}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>{t.clientsPage.cancel}</Button>
            <Button onClick={handleDeletePatient} color="error" variant="contained">
              {t.clientsPage.remove}
            </Button>
          </DialogActions>
        </Dialog>
      </WellnessLayout>
  );
};

export default PatientListPage;
