/**
 * LogViewer - System logs viewing component
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useAdminData } from '../../hooks/useAdminData';

const LogViewer: React.FC = () => {
  const { getSystemLogs } = useAdminData();
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [level, setLevel] = useState('');
  const [service, setService] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const logLevels = ['debug', 'info', 'warn', 'error'];
  const services = [
    'api-gateway',
    'auth-service', 
    'appointments-service',
    'files-service',
    'notifications-service',
    'ai-service',
    'notes-service',
    'analytics-service',
    'settings-service'
  ];

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: any = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (level) filters.level = level;
      if (service) filters.service = service;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const response = await getSystemLogs(filters);
      setLogs(response.logs);
      setPagination(response.pagination);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage]);

  const handleSearch = () => {
    setPage(0);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setLevel('');
    setService('');
    setStartDate('');
    setEndDate('');
    setPage(0);
    fetchLogs();
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
      case 'info':
        return 'info';
      case 'debug':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            Log Filters
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Log Level</InputLabel>
                <Select
                  value={level}
                  label="Log Level"
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  {logLevels.map((lvl) => (
                    <MenuItem key={lvl} value={lvl}>
                      {lvl.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Service</InputLabel>
                <Select
                  value={service}
                  label="Service"
                  onChange={(e) => setService(e.target.value)}
                >
                  <MenuItem value="">All Services</MenuItem>
                  {services.map((svc) => (
                    <MenuItem key={svc} value={svc}>
                      {svc}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
              >
                Search
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              System Logs
              {pagination && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ({pagination.total} total entries)
                </Typography>
              )}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchLogs}
                disabled={loading}
                size="small"
              >
                Refresh
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                variant="outlined"
                size="small"
              >
                Export
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log, index) => (
                      <TableRow key={log.id || index} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {formatTimestamp(log.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.level.toUpperCase()}
                            size="small"
                            color={getLevelColor(log.level) as any}
                            variant={log.level === 'error' ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.service}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 400 }}>
                            {log.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {log.details && (
                            <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                              <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{ minHeight: 32, '& .MuiAccordionSummary-content': { margin: '8px 0' } }}
                              >
                                <Typography variant="caption">
                                  View Details
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ pt: 0 }}>
                                <Box
                                  component="pre"
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                    backgroundColor: 'grey.100',
                                    p: 1,
                                    borderRadius: 1,
                                    overflow: 'auto',
                                    maxHeight: 200,
                                  }}
                                >
                                  {JSON.stringify(log.details, null, 2)}
                                </Box>
                              </AccordionDetails>
                            </Accordion>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {pagination && (
                <TablePagination
                  component="div"
                  count={pagination.total}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[25, 50, 100, 200]}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LogViewer;