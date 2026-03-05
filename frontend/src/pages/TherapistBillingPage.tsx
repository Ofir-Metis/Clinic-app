import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  AttachMoney,
  Receipt,
  TrendingUp,
  People,
  Add,
  Edit,
  Visibility,
  Payment,
  Send,
  Download,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../AuthContext';
import { getMyPatients, Patient as ApiPatient } from '../api/patients';
import { useTranslation } from '../contexts/LanguageContext';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface PricingRule {
  id: string;
  clientId?: string;
  clientName?: string;
  sessionPrice: number;
  package4Price?: number;
  package8Price?: number;
  package12Price?: number;
  monthlySubscription?: number;
  discountPercentage: number;
  isDefault: boolean;
  isActive: boolean;
}

interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  paymentType: 'session' | 'package' | 'subscription';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate: string;
  description: string;
  receiptNumber?: string;
  vatIncluded: boolean;
}

interface PaymentMetrics {
  totalRevenue: number;
  pendingPayments: number;
  completedThisMonth: number;
  averageSessionPrice: number;
  clientCount: number;
}

const TherapistBillingPage: React.FC = () => {
  const { user } = useAuth();
  const { translations } = useTranslation();
  const t = translations.billing as Record<string, unknown> | undefined;
  const [activeTab, setActiveTab] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const [editPricingOpen, setEditPricingOpen] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState<PricingRule | null>(null);

  // Form states
  const [newPayment, setNewPayment] = useState({
    clientId: '',
    amount: '',
    paymentType: 'session' as const,
    description: '',
    packageSessions: 1,
  });

  const [newPricing, setNewPricing] = useState({
    clientId: '',
    sessionPrice: '',
    package4Price: '',
    package8Price: '',
    package12Price: '',
    monthlySubscription: '',
    discountPercentage: '0',
    isDefault: false,
  });

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const therapistId = parseInt(user.id);

      // Fetch real clients from API
      let realClients: Client[] = [];
      try {
        const patientsResponse = await getMyPatients(therapistId, 0, 100);
        realClients = patientsResponse.items.map((p: ApiPatient) => ({
          id: p.id.toString(),
          name: `${p.firstName} ${p.lastName}`,
          email: p.email,
          phone: '',
        }));
        setClients(realClients);
      } catch (clientError) {
        console.warn('Could not fetch clients:', clientError);
        realClients = [];
        setClients([]);
      }

      // Set metrics based on actual client count
      setMetrics({
        totalRevenue: 0, // No billing API yet
        pendingPayments: 0,
        completedThisMonth: 0,
        averageSessionPrice: 450,
        clientCount: realClients.length,
      });

      // Default pricing rule (no billing API yet)
      setPricingRules([
        {
          id: '1',
          sessionPrice: 450,
          package4Price: 1600,
          package8Price: 3000,
          package12Price: 4200,
          monthlySubscription: 1400,
          discountPercentage: 0,
          isDefault: true,
          isActive: true,
        },
      ]);

      // No payments data until billing API is available
      setPayments([]);
    } catch (err) {
      console.error('Failed to load billing data:', err);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    const paymentTypes = t?.paymentTypes as Record<string, string> | undefined;
    switch (type) {
      case 'session': return paymentTypes?.session || 'Single Session';
      case 'package': return paymentTypes?.package || 'Session Package';
      case 'subscription': return paymentTypes?.subscription || 'Monthly Subscription';
      default: return type;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreatePayment = () => {
    // Handle payment creation logic
    const client = clients.find(c => c.id === newPayment.clientId);
    if (!client) return;

    const payment: Payment = {
      id: Date.now().toString(),
      clientId: newPayment.clientId,
      clientName: client.name,
      amount: parseFloat(newPayment.amount),
      paymentType: newPayment.paymentType,
      status: 'pending',
      paymentDate: new Date().toISOString().split('T')[0],
      description: newPayment.description,
      vatIncluded: true,
    };

    setPayments([...payments, payment]);
    setCreatePaymentOpen(false);
    setNewPayment({
      clientId: '',
      amount: '',
      paymentType: 'session',
      description: '',
      packageSessions: 1,
    });
  };

  const MetricsCards = () => {
    const metricsT = t?.metrics as Record<string, string> | undefined;
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {metricsT?.totalRevenue || 'Total Revenue'}
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(metrics?.totalRevenue || 0)}
                  </Typography>
                </Box>
                <AttachMoney color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {metricsT?.pendingPayments || 'Pending Payments'}
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.pendingPayments || 0}
                  </Typography>
                </Box>
                <Receipt color="warning" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {metricsT?.thisMonth || 'This Month'}
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.completedThisMonth || 0}
                  </Typography>
                </Box>
                <TrendingUp color="success" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {metricsT?.avgSessionPrice || 'Avg Session Price'}
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(metrics?.averageSessionPrice || 0)}
                  </Typography>
                </Box>
                <Payment color="info" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {metricsT?.activeClients || 'Active Clients'}
                  </Typography>
                  <Typography variant="h4">
                    {metrics?.clientCount || 0}
                  </Typography>
                </Box>
                <People color="secondary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const PaymentsTable = () => {
    const paymentsT = t?.payments as Record<string, string> | undefined;
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">{paymentsT?.title || 'Client Payments'}</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreatePaymentOpen(true)}
          >
            {paymentsT?.createPayment || 'Create Payment Request'}
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{paymentsT?.client || 'Client'}</TableCell>
                <TableCell>{paymentsT?.amount || 'Amount'}</TableCell>
                <TableCell>{paymentsT?.type || 'Type'}</TableCell>
                <TableCell>{paymentsT?.status || 'Status'}</TableCell>
                <TableCell>{paymentsT?.date || 'Date'}</TableCell>
                <TableCell>{paymentsT?.receipt || 'Receipt'}</TableCell>
                <TableCell>{paymentsT?.actions || 'Actions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {payment.clientName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {payment.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(payment.amount)}
                    </Typography>
                    {payment.vatIncluded && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        {paymentsT?.vatIncluded || 'VAT included'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getPaymentTypeLabel(payment.paymentType)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status.toUpperCase()}
                      color={getStatusColor(payment.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(payment.paymentDate).toLocaleDateString('he-IL')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {payment.receiptNumber ? (
                      <Typography variant="body2" color="success.main">
                        {payment.receiptNumber}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        {paymentsT?.pending || 'Pending'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title={paymentsT?.viewDetails || 'View Details'}>
                        <IconButton size="small" color="primary">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {payment.status === 'pending' && (
                        <Tooltip title={paymentsT?.sendPaymentLink || 'Send Payment Link'}>
                          <IconButton size="small" color="success">
                            <Send />
                          </IconButton>
                        </Tooltip>
                      )}
                      {payment.receiptNumber && (
                        <Tooltip title={paymentsT?.downloadReceipt || 'Download Receipt'}>
                          <IconButton size="small" color="info">
                            <Download />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const PricingTable = () => {
    const pricingT = t?.pricing as Record<string, string> | undefined;
    const paymentsT = t?.payments as Record<string, string> | undefined;
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">{pricingT?.title || 'Pricing Rules'}</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setSelectedPricing(null);
              setEditPricingOpen(true);
            }}
          >
            {pricingT?.addCustomPricing || 'Add Custom Pricing'}
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{paymentsT?.client || 'Client'}</TableCell>
                <TableCell>{pricingT?.sessionPrice || 'Session Price'}</TableCell>
                <TableCell>{pricingT?.package4 || '4-Session Package'}</TableCell>
                <TableCell>{pricingT?.package8 || '8-Session Package'}</TableCell>
                <TableCell>{pricingT?.monthlySubscription || 'Monthly Subscription'}</TableCell>
                <TableCell>{pricingT?.discount || 'Discount'}</TableCell>
                <TableCell>{paymentsT?.actions || 'Actions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pricingRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {rule.clientName || (pricingT?.defaultPricing || 'Default Pricing')}
                    </Typography>
                    {rule.isDefault && (
                      <Chip label="Default" size="small" color="primary" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {formatCurrency(rule.sessionPrice)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {rule.package4Price ? formatCurrency(rule.package4Price) : '-'}
                    </Typography>
                    {rule.package4Price && (
                      <Typography variant="caption" color="success.main" display="block">
                        {formatCurrency(rule.package4Price / 4)}{pricingT?.perSession || '/session'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {rule.package8Price ? formatCurrency(rule.package8Price) : '-'}
                    </Typography>
                    {rule.package8Price && (
                      <Typography variant="caption" color="success.main" display="block">
                        {formatCurrency(rule.package8Price / 8)}{pricingT?.perSession || '/session'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {rule.monthlySubscription ? formatCurrency(rule.monthlySubscription) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {rule.discountPercentage > 0 ? (
                      <Chip
                        label={`${rule.discountPercentage}%`}
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        {pricingT?.none || 'None'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title={pricingT?.editPricing || 'Edit Pricing'}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelectedPricing(rule);
                            setEditPricingOpen(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      {!rule.isDefault && (
                        <Tooltip title={pricingT?.removeCustomPricing || 'Remove Custom Pricing'}>
                          <IconButton size="small" color="error">
                            <Settings />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const CreatePaymentDialog = () => {
    const dialogsT = t?.dialogs as Record<string, Record<string, string>> | undefined;
    const createT = dialogsT?.createPayment;
    const paymentTypes = t?.paymentTypes as Record<string, string> | undefined;
    return (
      <Dialog open={createPaymentOpen} onClose={() => setCreatePaymentOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{createT?.title || 'Create Payment Request'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{createT?.clientLabel || 'Client'}</InputLabel>
                <Select
                  value={newPayment.clientId}
                  onChange={(e) => setNewPayment({ ...newPayment, clientId: e.target.value })}
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{createT?.paymentTypeLabel || 'Payment Type'}</InputLabel>
                <Select
                  value={newPayment.paymentType}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentType: e.target.value as any })}
                >
                  <MenuItem value="session">{paymentTypes?.session || 'Single Session'}</MenuItem>
                  <MenuItem value="package">{paymentTypes?.package || 'Session Package'}</MenuItem>
                  <MenuItem value="subscription">{paymentTypes?.subscription || 'Monthly Subscription'}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={createT?.amountLabel || 'Amount (ILS)'}
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={createT?.descriptionLabel || 'Description'}
                multiline
                rows={2}
                value={newPayment.description}
                onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                placeholder={createT?.descriptionPlaceholder || 'e.g., Therapy session - February 2, 2025'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePaymentOpen(false)}>{createT?.cancel || 'Cancel'}</Button>
          <Button variant="contained" onClick={handleCreatePayment}>
            {createT?.create || 'Create Payment Request'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const EditPricingDialog = () => {
    const dialogsT = t?.dialogs as Record<string, Record<string, string>> | undefined;
    const editT = dialogsT?.editPricing;
    return (
      <Dialog open={editPricingOpen} onClose={() => setEditPricingOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPricing ? (editT?.titleEdit || 'Edit Pricing Rule') : (editT?.titleCreate || 'Create Custom Pricing')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {!selectedPricing?.isDefault && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{editT?.clientOptional || 'Client (Optional)'}</InputLabel>
                  <Select
                    value={newPricing.clientId}
                    onChange={(e) => setNewPricing({ ...newPricing, clientId: e.target.value })}
                  >
                    <MenuItem value="">{editT?.defaultForAll || 'Default for all clients'}</MenuItem>
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={editT?.sessionPriceLabel || 'Session Price (ILS)'}
                type="number"
                value={newPricing.sessionPrice}
                onChange={(e) => setNewPricing({ ...newPricing, sessionPrice: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={editT?.package4Label || '4-Session Package (ILS)'}
                type="number"
                value={newPricing.package4Price}
                onChange={(e) => setNewPricing({ ...newPricing, package4Price: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={editT?.package8Label || '8-Session Package (ILS)'}
                type="number"
                value={newPricing.package8Price}
                onChange={(e) => setNewPricing({ ...newPricing, package8Price: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={editT?.monthlySubLabel || 'Monthly Subscription (ILS)'}
                type="number"
                value={newPricing.monthlySubscription}
                onChange={(e) => setNewPricing({ ...newPricing, monthlySubscription: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={editT?.discountLabel || 'Discount Percentage'}
                type="number"
                value={newPricing.discountPercentage}
                onChange={(e) => setNewPricing({ ...newPricing, discountPercentage: e.target.value })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPricingOpen(false)}>{editT?.cancel || 'Cancel'}</Button>
          <Button variant="contained" onClick={() => setEditPricingOpen(false)}>
            {selectedPricing ? (editT?.update || 'Update Pricing') : (editT?.createRule || 'Create Pricing Rule')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const tabsT = t?.tabs as Record<string, string> | undefined;
  const comingSoonT = t?.comingSoon as Record<string, string> | undefined;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {(t?.title as string) || 'Billing & Payments'}
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        {(t?.subtitle as string) || 'Manage client payments, pricing, and invoicing with Israeli VAT compliance'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <MetricsCards />

      <Card>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={tabsT?.payments || 'Payments'} />
          <Tab label={tabsT?.pricing || 'Pricing Rules'} />
          <Tab label={tabsT?.invoices || 'Invoices'} />
          <Tab label={tabsT?.reports || 'Reports'} />
        </Tabs>

        <CardContent>
          {activeTab === 0 && <PaymentsTable />}
          {activeTab === 1 && <PricingTable />}
          {activeTab === 2 && (
            <Typography variant="h6" color="textSecondary">
              {comingSoonT?.invoices || 'Invoice Management - Coming Soon'}
            </Typography>
          )}
          {activeTab === 3 && (
            <Typography variant="h6" color="textSecondary">
              {comingSoonT?.reports || 'Financial Reports - Coming Soon'}
            </Typography>
          )}
        </CardContent>
      </Card>

      <CreatePaymentDialog />
      <EditPricingDialog />

      <Fab
        color="primary"
        aria-label={(t?.addPayment as string) || 'add payment'}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreatePaymentOpen(true)}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default TherapistBillingPage;