import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Alert,
  Skeleton,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  History as HistoryIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Notes as NotesIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { DateRangePicker, LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { logger } from '../logger';
import { API_URL } from '../env';
import WellnessLayout from '../layouts/WellnessLayout';

interface AppointmentRow {
  id: number;
  date: string;
  therapistName: string;
  type: string;
  notesSnippet: string;
}

const PatientHistoryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [therapists, setTherapists] = useState<{ id: number; name: string }[]>([]);
  const [therapistId, setTherapistId] = useState<number | null>(null);
  const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/therapists`)
      .then((r) => setTherapists(r.data))
      .catch(() => setTherapists([]));
  }, []);

  const fetchData = () => {
    setLoading(true);
    logger.debug('fetch history');
    axios
      .get(`${API_URL}/patient/appointments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: {
          patientId: 0,
          therapistId: therapistId || undefined,
          start: range[0]?.toISOString(),
          end: range[1]?.toISOString(),
          page: page + 1,
          limit: pageSize,
        },
      })
      .then((r) => {
        setRows(
          r.data.items.map((a: any) => ({
            id: a.id,
            date: a.startTime,
            therapistName: a.therapistName,
            type: a.type,
            notesSnippet: a.notes?.slice(0, 50) || '',
          })),
        );
        setError('');
      })
      .catch(() => setError('error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const columns: GridColDef[] = [
    { field: 'date', headerName: t('date', 'Date'), flex: 1 },
    { field: 'therapistName', headerName: t('therapist', 'Therapist'), flex: 1 },
    { field: 'type', headerName: t('type', 'Type'), flex: 1 },
    { field: 'notesSnippet', headerName: t('notes', 'Notes'), flex: 2 },
  ];

  return (
    <WellnessLayout
      title="Patient History"
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
          📋 Treatment History
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Complete record of patient appointments and therapy sessions
        </Typography>
      </Box>

      {/* Filters Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="primary" />
            Search & Filter
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                SelectProps={{ native: true }}
                label={t('therapist', 'Therapist')}
                value={therapistId ?? ''}
                onChange={(e) => setTherapistId(Number(e.target.value) || null)}
                aria-label="therapist-filter"
              >
                <option value="">{t('allTherapists', 'All Therapists')}</option>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateRangePicker 
                  value={range} 
                  onChange={(r) => setRange(r)}
                  localeText={{ start: 'Start Date', end: 'End Date' }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                fullWidth
                variant="contained" 
                size="large"
                onClick={() => { setPage(0); fetchData(); }} 
                aria-label="apply-filters"
                sx={{ height: 56 }}
              >
                {t('apply', 'Apply')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {/* Results Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" />
            Appointment History ({rows.length} sessions)
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Stack spacing={2}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={80} />
              ))}
            </Stack>
          ) : rows.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              background: 'rgba(46, 125, 107, 0.04)',
              borderRadius: 2,
            }}>
              <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {t('noTreatments', 'No treatments found')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Adjust your filters or check back later for appointment history
              </Typography>
            </Box>
          ) : (
            <DataGrid
              rows={rows}
              columns={[
                { 
                  field: 'date', 
                  headerName: t('date', 'Date'), 
                  flex: 1,
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon fontSize="small" color="action" />
                      {new Date(params.value).toLocaleDateString()}
                    </Box>
                  )
                },
                { 
                  field: 'therapistName', 
                  headerName: t('therapist', 'Therapist'), 
                  flex: 1,
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      {params.value}
                    </Box>
                  )
                },
                { 
                  field: 'type', 
                  headerName: t('type', 'Type'), 
                  flex: 1,
                  renderCell: (params) => (
                    <Chip 
                      label={params.value} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  )
                },
                { 
                  field: 'notesSnippet', 
                  headerName: t('notes', 'Notes'), 
                  flex: 2,
                  renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotesIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {params.value || 'No notes available'}
                      </Typography>
                    </Box>
                  )
                },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  width: 100,
                  sortable: false,
                  renderCell: (params) => (
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patient/history/${params.row.id}`);
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )
                }
              ]}
              pagination
              paginationMode="server"
              rowCount={1000}
              pageSizeOptions={[5, 10, 20]}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(m: GridPaginationModel) => {
                setPage(m.page);
                setPageSize(m.pageSize);
              }}
              onRowClick={(p) => navigate(`/patient/history/${p.row.id}`)}
              autoHeight
              disableRowSelectionOnClick
              aria-label="history-grid"
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid rgba(46, 125, 107, 0.12)',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'rgba(46, 125, 107, 0.08)',
                  borderBottom: '2px solid rgba(46, 125, 107, 0.2)',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(46, 125, 107, 0.04)',
                  cursor: 'pointer',
                },
              }}
            />
          )}
        </CardContent>
      </Card>
    </WellnessLayout>
  );
};

export default PatientHistoryPage;
