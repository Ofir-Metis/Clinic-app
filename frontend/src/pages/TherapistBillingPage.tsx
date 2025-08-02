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
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data for development
      setMetrics({
        totalRevenue: 42500,
        pendingPayments: 3,
        completedThisMonth: 28,
        averageSessionPrice: 450,
        clientCount: 15,
      });

      setClients([
        { id: '1', name: 'Anna Goldberg', email: 'anna@example.com', phone: '050-123-4567' },
        { id: '2', name: 'Michael Rosen', email: 'michael@example.com', phone: '052-987-6543' },
        { id: '3', name: 'Rachel Levy', email: 'rachel@example.com', phone: '053-456-7890' },
      ]);

      setPricingRules([
        {
          id: '1',
          clientId: '1',
          clientName: 'Anna Goldberg',
          sessionPrice: 500,
          package4Price: 1800,
          package8Price: 3400,
          package12Price: 4800,
          monthlySubscription: 1600,
          discountPercentage: 0,
          isDefault: false,
          isActive: true,
        },
        {
          id: '2',
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

      setPayments([
        {
          id: '1',
          clientId: '1',
          clientName: 'Anna Goldberg',
          amount: 500,
          paymentType: 'session',
          status: 'completed',
          paymentDate: '2025-01-28',
          description: 'Therapy session - January 28, 2025',
          receiptNumber: 'REC-2025-001',
          vatIncluded: true,
        },
        {
          id: '2',
          clientId: '2',
          clientName: 'Michael Rosen',
          amount: 1600,
          paymentType: 'package',
          status: 'pending',
          paymentDate: '2025-02-01',
          description: '4-session package',
          vatIncluded: true,
        },
        {
          id: '3',
          clientId: '3',
          clientName: 'Rachel Levy',
          amount: 1400,
          paymentType: 'subscription',
          status: 'completed',
          paymentDate: '2025-01-30',
          description: 'Monthly subscription - February 2025',
          receiptNumber: 'REC-2025-002',
          vatIncluded: true,
        },
      ]);
    } catch (err) {
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
    switch (type) {
      case 'session': return 'Single Session';
      case 'package': return 'Session Package';
      case 'subscription': return 'Monthly Subscription';
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

  const MetricsCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
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
                  Pending Payments
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
                  This Month
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
                  Avg Session Price
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
                  Active Clients
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

  const PaymentsTable = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Client Payments</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreatePaymentOpen(true)}
        >
          Create Payment Request
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Receipt</TableCell>
              <TableCell>Actions</TableCell>
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
                      VAT included
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
                      Pending
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="View Details">
                      <IconButton size="small" color="primary">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {payment.status === 'pending' && (
                      <Tooltip title="Send Payment Link">
                        <IconButton size="small" color="success">
                          <Send />
                        </IconButton>
                      </Tooltip>
                    )}
                    {payment.receiptNumber && (
                      <Tooltip title="Download Receipt">
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

  const PricingTable = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Pricing Rules</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedPricing(null);
            setEditPricingOpen(true);
          }}
        >
          Add Custom Pricing
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Session Price</TableCell>
              <TableCell>4-Session Package</TableCell>
              <TableCell>8-Session Package</TableCell>
              <TableCell>Monthly Subscription</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pricingRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {rule.clientName || 'Default Pricing'}
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
                      {formatCurrency(rule.package4Price / 4)}/session
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {rule.package8Price ? formatCurrency(rule.package8Price) : '-'}
                  </Typography>
                  {rule.package8Price && (
                    <Typography variant="caption" color="success.main" display="block">
                      {formatCurrency(rule.package8Price / 8)}/session
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
                      None
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Edit Pricing">
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
                      <Tooltip title="Remove Custom Pricing">
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

  const CreatePaymentDialog = () => (
    <Dialog open={createPaymentOpen} onClose={() => setCreatePaymentOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Create Payment Request</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Client</InputLabel>
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
              <InputLabel>Payment Type</InputLabel>
              <Select
                value={newPayment.paymentType}
                onChange={(e) => setNewPayment({ ...newPayment, paymentType: e.target.value as any })}
              >
                <MenuItem value="session">Single Session</MenuItem>
                <MenuItem value="package">Session Package</MenuItem>
                <MenuItem value="subscription">Monthly Subscription</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Amount (ILS)"
              type="number"
              value={newPayment.amount}
              onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={newPayment.description}
              onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
              placeholder="e.g., Therapy session - February 2, 2025"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCreatePaymentOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleCreatePayment}>
          Create Payment Request
        </Button>
      </DialogActions>
    </Dialog>
  );

  const EditPricingDialog = () => (
    <Dialog open={editPricingOpen} onClose={() => setEditPricingOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedPricing ? 'Edit Pricing Rule' : 'Create Custom Pricing'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {!selectedPricing?.isDefault && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Client (Optional)</InputLabel>
                <Select
                  value={newPricing.clientId}
                  onChange={(e) => setNewPricing({ ...newPricing, clientId: e.target.value })}
                >
                  <MenuItem value="">Default for all clients</MenuItem>
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
              label="Session Price (ILS)"
              type="number"
              value={newPricing.sessionPrice}
              onChange={(e) => setNewPricing({ ...newPricing, sessionPrice: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="4-Session Package (ILS)"
              type="number"
              value={newPricing.package4Price}
              onChange={(e) => setNewPricing({ ...newPricing, package4Price: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="8-Session Package (ILS)"
              type="number"
              value={newPricing.package8Price}
              onChange={(e) => setNewPricing({ ...newPricing, package8Price: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Monthly Subscription (ILS)"
              type="number"
              value={newPricing.monthlySubscription}
              onChange={(e) => setNewPricing({ ...newPricing, monthlySubscription: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Discount Percentage"
              type="number"
              value={newPricing.discountPercentage}
              onChange={(e) => setNewPricing({ ...newPricing, discountPercentage: e.target.value })}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditPricingOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={() => setEditPricingOpen(false)}>
          {selectedPricing ? 'Update Pricing' : 'Create Pricing Rule'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Billing & Payments
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Manage client payments, pricing, and invoicing with Israeli VAT compliance
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <MetricsCards />

      <Card>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Payments" />
          <Tab label="Pricing Rules" />
          <Tab label="Invoices" />
          <Tab label="Reports" />
        </Tabs>

        <CardContent>
          {activeTab === 0 && <PaymentsTable />}
          {activeTab === 1 && <PricingTable />}
          {activeTab === 2 && (
            <Typography variant="h6" color="textSecondary">
              Invoice Management - Coming Soon
            </Typography>
          )}
          {activeTab === 3 && (
            <Typography variant="h6" color="textSecondary">
              Financial Reports - Coming Soon
            </Typography>
          )}
        </CardContent>
      </Card>

      <CreatePaymentDialog />
      <EditPricingDialog />

      <Fab
        color="primary"
        aria-label="add payment"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreatePaymentOpen(true)}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default TherapistBillingPage;