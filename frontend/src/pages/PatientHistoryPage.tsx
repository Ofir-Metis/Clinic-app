import React, { useEffect, useMemo, useState } from 'react';
import {
  Typography,
  ThemeProvider,
  CssBaseline,
  Box,
  Alert,
  Skeleton,
  Button,
  TextField,
} from '@mui/material';

import PageAppBar from '../components/PageAppBar';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { DateRangePicker } from '@mui/x-date-pickers-pro';
import { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { logger } from '../logger';
import { createAppTheme } from '../theme';

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
  const theme = useMemo(() => createAppTheme(i18n.dir()), [i18n]);
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [therapists, setTherapists] = useState<{ id: number; name: string }[]>([]);
  const [therapistId, setTherapistId] = useState<number | null>(null);
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/therapists`)
      .then((r) => setTherapists(r.data))
      .catch(() => setTherapists([]));
  }, []);

  const fetchData = () => {
    setLoading(true);
    logger.debug('fetch history');
    axios
      .get(`${import.meta.env.VITE_API_URL}/patient/appointments`, {
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PageAppBar avatarUrls={[]} />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            select
            SelectProps={{ native: true }}
            label={t('therapist')}
            value={therapistId ?? ''}
            onChange={(e) => setTherapistId(Number(e.target.value) || null)}
            aria-label="therapist-filter"
          >
            <option value="" />
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </TextField>
          <DateRangePicker value={range} onChange={(r) => setRange(r)} />
          <Button variant="contained" onClick={() => { setPage(0); fetchData(); }} aria-label="apply-filters">
            {t('applyFilters', 'Apply Filters')}
          </Button>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Skeleton variant="rectangular" height={200} />
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 5 }}>{t('noTreatments', 'No treatments found')}</Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
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
            aria-label="history-grid"
          />
        )}
      </Box>
    </ThemeProvider>
  );
};

export default PatientHistoryPage;
