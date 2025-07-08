import React, { useMemo, useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
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
import { useTranslation } from 'react-i18next';
import { getMyPatients, Patient } from '../api/patients';
import { useAuth } from '../AuthContext';
import { createAppTheme } from '../theme';

const PatientListPage: React.FC = () => {
  const { t, i18n } = useTranslation();
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

  const theme = useMemo(() => createAppTheme(i18n.dir()), [i18n]);

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
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t('myPatients')}
          </Typography>
          <TextField
            size="small"
            placeholder={t('searchPatients')}
            onChange={(e) => setPendingSearch(e.target.value)}
          />
        </Toolbar>
      </AppBar>
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
                        <IconButton color="primary" href={`/patients/${p.id}`}>↗</IconButton>
                        <IconButton color="primary">+</IconButton>
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
                          <IconButton color="primary" href={`/patients/${p.id}`}>↗</IconButton>
                          <IconButton color="primary">+</IconButton>
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
      <Fab color="primary" sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <AddIcon />
      </Fab>
    </ThemeProvider>
  );
};

export default PatientListPage;
