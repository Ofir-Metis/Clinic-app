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
} from '@mui/material';
import {
  TrendingUp,
  People,
  CreditCard,
  Assessment,
  Add,
  Edit,
  Visibility,
  Block,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';

interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthlyNis: number;
  priceMonthlyUsd: number;
  maxClients: number;
  features: Record<string, any>;
  isActive: boolean;
}

interface CoachSubscription {
  id: string;
  coachId: string;
  coachName: string;
  coachEmail: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'suspended' | 'past_due';
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  startDate: string;
  nextBillingDate: string;
  discountPercentage: number;
  currency: string;
}

interface SubscriptionMetrics {
  totalActiveSubscriptions: number;
  totalMonthlyRecurringRevenue: number;
  churnRate: number;
  averageRevenuePerUser: number;
  planDistribution: Record<string, number>;
}

const SubscriptionManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [subscriptions, setSubscriptions] = useState<CoachSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [editSubscriptionOpen, setEditSubscriptionOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<CoachSubscription | null>(null);

  // Form states
  const [newPlan, setNewPlan] = useState({
    name: '',
    priceMonthlyNis: '',
    priceMonthlyUsd: '',
    maxClients: '',
    features: {},
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data for development
      setMetrics({
        totalActiveSubscriptions: 45,
        totalMonthlyRecurringRevenue: 16200,
        churnRate: 3.2,
        averageRevenuePerUser: 360,
        planDistribution: {
          'Starter': 18,
          'Professional': 20,
          'Enterprise': 7,
        },
      });

      setPlans([
        {
          id: '1',
          name: 'Starter',
          priceMonthlyNis: 180,
          priceMonthlyUsd: 50,
          maxClients: 20,
          features: { basicScheduling: true, emailSupport: true },
          isActive: true,
        },
        {
          id: '2',
          name: 'Professional',
          priceMonthlyNis: 360,
          priceMonthlyUsd: 100,
          maxClients: 50,
          features: { advancedAnalytics: true, phoneSupport: true, customBranding: true },
          isActive: true,
        },
        {
          id: '3',
          name: 'Enterprise',
          priceMonthlyNis: 540,
          priceMonthlyUsd: 150,
          maxClients: -1,
          features: { apiAccess: true, dedicatedSupport: true, whiteLabel: true },
          isActive: true,
        },
      ]);

      setSubscriptions([
        {
          id: '1',
          coachId: 'coach1',
          coachName: 'Dr. Sarah Cohen',
          coachEmail: 'sarah@example.com',
          plan: plans[1] || {} as SubscriptionPlan,
          status: 'active',
          billingCycle: 'monthly',
          startDate: '2024-01-15',
          nextBillingDate: '2025-02-15',
          discountPercentage: 0,
          currency: 'ILS',
        },
        {
          id: '2',
          coachId: 'coach2',
          coachName: 'David Levi',
          coachEmail: 'david@example.com',
          plan: plans[0] || {} as SubscriptionPlan,
          status: 'past_due',
          billingCycle: 'annual',
          startDate: '2023-06-01',
          nextBillingDate: '2025-02-10',
          discountPercentage: 10,
          currency: 'ILS',
        },
      ]);
    } catch (err) {
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'past_due': return 'warning';
      case 'suspended': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'past_due': return <Warning />;
      case 'suspended': return <Error />;
      case 'cancelled': return <Block />;
      default: return null;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const formatCurrency = (amount: number, currency: string = 'ILS') => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const MetricsCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Active Subscriptions
                </Typography>
                <Typography variant="h4">
                  {metrics?.totalActiveSubscriptions || 0}
                </Typography>
              </Box>
              <People color="primary" fontSize="large" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Monthly Revenue
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(metrics?.totalMonthlyRecurringRevenue || 0)}
                </Typography>
              </Box>
              <CreditCard color="primary" fontSize="large" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Churn Rate
                </Typography>
                <Typography variant="h4">
                  {metrics?.churnRate?.toFixed(1) || 0}%
                </Typography>
              </Box>
              <TrendingUp color="primary" fontSize="large" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  ARPU
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(metrics?.averageRevenuePerUser || 0)}
                </Typography>
              </Box>
              <Assessment color="primary" fontSize="large" />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const SubscriptionsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Coach</TableCell>
            <TableCell>Plan</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Billing Cycle</TableCell>
            <TableCell>Next Billing</TableCell>
            <TableCell>Revenue</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {subscription.coachName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {subscription.coachEmail}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2">
                    {subscription.plan.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatCurrency(subscription.plan.priceMonthlyNis)}/month
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  icon={getStatusIcon(subscription.status)}
                  label={subscription.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(subscription.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" textTransform="capitalize">
                  {subscription.billingCycle}
                </Typography>
                {subscription.discountPercentage > 0 && (
                  <Typography variant="caption" color="success.main">
                    {subscription.discountPercentage}% discount
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(subscription.nextBillingDate).toLocaleDateString('he-IL')}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(subscription.plan.priceMonthlyNis)}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1}>
                  <Tooltip title="View Details">
                    <IconButton size="small" color="primary">
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Subscription">
                    <IconButton 
                      size="small" 
                      color="secondary"
                      onClick={() => {
                        setSelectedSubscription(subscription);
                        setEditSubscriptionOpen(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Suspend">
                    <IconButton size="small" color="warning">
                      <Block />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const PlansTable = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Subscription Plans</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreatePlanOpen(true)}
        >
          Create Plan
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Plan Name</TableCell>
              <TableCell>Price (ILS)</TableCell>
              <TableCell>Price (USD)</TableCell>
              <TableCell>Max Clients</TableCell>
              <TableCell>Features</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Subscribers</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <Typography variant="body1" fontWeight="bold">
                    {plan.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  {formatCurrency(plan.priceMonthlyNis)}
                </TableCell>
                <TableCell>
                  ${plan.priceMonthlyUsd}
                </TableCell>
                <TableCell>
                  {plan.maxClients === -1 ? 'Unlimited' : plan.maxClients}
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {Object.keys(plan.features).slice(0, 3).map((feature) => (
                      <Chip key={feature} label={feature} size="small" variant="outlined" />
                    ))}
                    {Object.keys(plan.features).length > 3 && (
                      <Chip label={`+${Object.keys(plan.features).length - 3}`} size="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={plan.isActive ? 'Active' : 'Inactive'}
                    color={plan.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {metrics?.planDistribution[plan.name] || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Edit Plan">
                      <IconButton size="small" color="primary">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Toggle Status">
                      <IconButton size="small" color="secondary">
                        <Block />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const CreatePlanDialog = () => (
    <Dialog open={createPlanOpen} onClose={() => setCreatePlanOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Create New Subscription Plan</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Plan Name"
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Max Clients"
              type="number"
              value={newPlan.maxClients}
              onChange={(e) => setNewPlan({ ...newPlan, maxClients: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Price (NIS)"
              type="number"
              value={newPlan.priceMonthlyNis}
              onChange={(e) => setNewPlan({ ...newPlan, priceMonthlyNis: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Price (USD)"
              type="number"
              value={newPlan.priceMonthlyUsd}
              onChange={(e) => setNewPlan({ ...newPlan, priceMonthlyUsd: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCreatePlanOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={() => setCreatePlanOpen(false)}>
          Create Plan
        </Button>
      </DialogActions>
    </Dialog>
  );

  const EditSubscriptionDialog = () => (
    <Dialog open={editSubscriptionOpen} onClose={() => setEditSubscriptionOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Edit Subscription</DialogTitle>
      <DialogContent>
        {selectedSubscription && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="h6">
                {selectedSubscription.coachName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedSubscription.coachEmail}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select defaultValue={selectedSubscription.status}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Billing Cycle</InputLabel>
                <Select defaultValue={selectedSubscription.billingCycle}>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="annual">Annual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Discount Percentage"
                type="number"
                defaultValue={selectedSubscription.discountPercentage}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditSubscriptionOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={() => setEditSubscriptionOpen(false)}>
          Save Changes
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
        Subscription Management
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Manage coach subscriptions, plans, and billing for the Israeli market
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <MetricsCards />

      <Card>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Active Subscriptions" />
          <Tab label="Subscription Plans" />
          <Tab label="Billing History" />
          <Tab label="Analytics" />
        </Tabs>

        <CardContent>
          {activeTab === 0 && <SubscriptionsTable />}
          {activeTab === 1 && <PlansTable />}
          {activeTab === 2 && (
            <Typography variant="h6" color="textSecondary">
              Billing History - Coming Soon
            </Typography>
          )}
          {activeTab === 3 && (
            <Typography variant="h6" color="textSecondary">
              Advanced Analytics - Coming Soon
            </Typography>
          )}
        </CardContent>
      </Card>

      <CreatePlanDialog />
      <EditSubscriptionDialog />
    </Container>
  );
};

export default SubscriptionManagementPage;