import React, { useState, useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';
import WellnessLayout from '../layouts/WellnessLayout';

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
  diagnosis?: string;
  notes?: string;
}

const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    status: 'active',
    lastSession: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    upcomingAppointment: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    totalSessions: 12,
    diagnosis: 'Anxiety Disorder',
    notes: 'Making excellent progress with CBT techniques',
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 987-6543',
    status: 'active',
    lastSession: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    upcomingAppointment: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    totalSessions: 8,
    diagnosis: 'Depression',
  },
  {
    id: '3',
    firstName: 'Emma',
    lastName: 'Davis',
    email: 'emma.davis@email.com',
    status: 'on-hold',
    lastSession: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    totalSessions: 15,
    diagnosis: 'PTSD',
  },
  {
    id: '4',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@email.com',
    phone: '+1 (555) 456-7890',
    status: 'active',
    lastSession: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    upcomingAppointment: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    totalSessions: 6,
    diagnosis: 'Social Anxiety',
  },
];

const PatientListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(mockPatients);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Filter patients based on search and status
  useEffect(() => {
    let filtered = patients;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    setFilteredPatients(filtered);
  }, [patients, searchQuery, statusFilter]);

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

  return (
    <WellnessLayout
        title="Client Management"
        showFab={true}
        fabIcon={<AddIcon />}
        fabAction={handleAddPatient}
        fabAriaLabel="Add new client"
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
            👥 Your Clients
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Manage your client relationships and track their wellness journey
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
              placeholder="Search clients by name, email, or diagnosis..."
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
                All ({patients.length})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setStatusFilter('active')}
              >
                Active ({patients.filter(p => p.status === 'active').length})
              </Button>
              <Button
                variant={statusFilter === 'on-hold' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setStatusFilter('on-hold')}
              >
                On Hold ({patients.filter(p => p.status === 'on-hold').length})
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
                {searchQuery ? 'No clients found' : 'No clients yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchQuery 
                  ? 'Try adjusting your search criteria'
                  : 'Start building your client base by adding your first client'
                }
              </Typography>
              {!searchQuery && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddPatient}
                >
                  Add Your First Client
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Clients Grid */}
        {!loading && filteredPatients.length > 0 && (
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
            {filteredPatients.map((patient) => (
              <Grid item xs={12} sm={6} lg={4} key={patient.id}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme => `0 8px 24px ${theme.palette.primary.main}20`,
                    },
                  }}
                  onClick={() => navigate(`/patients/${patient.id}`)}
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

                      {patient.diagnosis && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <NotesIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {patient.diagnosis}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total Sessions
                          </Typography>
                          <Typography variant="h6" color="primary.main" fontWeight={700}>
                            {patient.totalSessions}
                          </Typography>
                        </Box>
                        
                        {patient.lastSession && (
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary">
                              Last Session
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
                              Next: {patient.upcomingAppointment.toLocaleDateString()}
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
                        Schedule
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
                        Call
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
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
            View Profile
          </MenuItem>
          <MenuItem onClick={() => {
            navigate(`/patients/${selectedPatient?.id}/edit`);
            handlePatientMenuClose();
          }}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit Details
          </MenuItem>
          <MenuItem onClick={() => {
            handleScheduleSession(selectedPatient?.id || '');
            handlePatientMenuClose();
          }}>
            <EventIcon sx={{ mr: 1 }} fontSize="small" />
            Schedule Session
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
            Remove Client
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="sm"
        >
          <DialogTitle>Remove Client</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove {selectedPatient?.firstName} {selectedPatient?.lastName} from your client list?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDeletePatient} color="error" variant="contained">
              Remove
            </Button>
          </DialogActions>
        </Dialog>
      </WellnessLayout>
  );
};

export default PatientListPage;
