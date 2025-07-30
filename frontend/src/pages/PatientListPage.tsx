import React, { useMemo, useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Typography,
  TextField,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Fab,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageAppBar from '../components/PageAppBar';
import { useTranslation } from 'react-i18next';
import { getMyPatients, Patient } from '../api/patients';
import { useAuth } from '../AuthContext';
import { theme } from '../theme';
import { useNavigate } from 'react-router-dom';

const PatientListPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMobile = useMediaQuery('(max-width:600px)');
  const { userId } = useAuth();

  useEffect(() => {
    const handler = setTimeout(() => setSearch(pendingSearch), 300);
    return () => clearTimeout(handler);
  }, [pendingSearch]);

  useEffect(() => {
    setLoading(true);
    getMyPatients(userId, page + 1, rowsPerPage, search)
      .then((res) => {
        setPatients(res.items);
        setTotal(res.total);
        setError('');
      })
      .catch(() => setError('failed'))
      .finally(() => setLoading(false));
  }, [page, rowsPerPage, search]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PageAppBar avatarUrls={[]} />
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
          size="small"
          placeholder={t('searchPatients')}
          onChange={(e) => setPendingSearch(e.target.value)}
        />
      </Box>
      <Box sx={{ p: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : patients.length === 0 ? (
          <Card sx={{ mt: 2 }}>
            <CardContent>{t('noPatients')}</CardContent>
          </Card>
        ) : (
          <>
            {!isMobile ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>{t('fullName')}</TableCell>
                    <TableCell>{t('email')}</TableCell>
                    <TableCell>{t('upcomingAppointment')}</TableCell>
                    <TableCell>{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Avatar src={p.avatarUrl} alt={p.firstName} />
                      </TableCell>
                      <TableCell>{`${p.firstName} ${p.lastName}`}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>
                        {p.upcomingAppointment
                          ? new Date(p.upcomingAppointment).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton color="primary" href={`/patients/${p.id}`} aria-label="view-patient">↗</IconButton>
                        <IconButton
                          color="primary"
                          aria-label={`add-note-${p.id}`}
                          onClick={() => navigate(`/patients/${p.id}/sessions/new`)}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Box>
                {patients.map((p) => (
                  <Card key={p.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={p.avatarUrl} alt={p.firstName} sx={{ mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography>{`${p.firstName} ${p.lastName}`}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {p.email}
                          </Typography>
                          <Typography variant="body2">
                            {p.upcomingAppointment
                              ? new Date(p.upcomingAppointment).toLocaleDateString()
                              : '-'}
                          </Typography>
                        </Box>
                        <Box>
                          <IconButton color="primary" href={`/patients/${p.id}`} aria-label="view-patient">↗</IconButton>
                          <IconButton
                            color="primary"
                            aria-label={`add-note-${p.id}`}
                            onClick={() => navigate(`/patients/${p.id}/sessions/new`)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Box>
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        aria-label="add-patient"
        onClick={() => navigate('/patients/new')}
      >
        <AddIcon />
      </Fab>
    </ThemeProvider>
  );
};

export default PatientListPage;
