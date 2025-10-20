/**
 * ComplianceAuditPage - Comprehensive compliance and audit management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Alert,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Gavel as ComplianceIcon,
  Visibility as AuditIcon,
  Assessment as ReportIcon,
  Security as SecurityIcon,
  Policy as PolicyIcon,
  Warning as RiskIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useAuth } from '../AuthContext';

interface ComplianceOverview {
  complianceScore: number;
  lastAssessment: Date;
  activeReports: number;
  pendingRequests: number;
  criticalFindings: number;
  auditEvents: {
    total: number;
    lastHour: number;
    highRisk: number;
    failedActions: number;
  };
  regulations: {
    hipaa: {
      status: 'compliant' | 'non_compliant' | 'partially_compliant';
      score: number;
      lastAudit: Date;
    };
    gdpr: {
      status: 'compliant' | 'non_compliant' | 'partially_compliant';
      score: number;
      lastAudit: Date;
    };
    soc2: {
      status: 'compliant' | 'non_compliant' | 'partially_compliant';
      score: number;
      lastAudit: Date;
    };
  };
  dataSubjectRights: {
    pendingRequests: number;
    averageResponseTime: number;
    overdueTasks: number;
  };
}

interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceType: string;
  outcome: 'success' | 'failure' | 'warning';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceFlags: string[];
  dataClassification?: string;
}

const ComplianceAuditPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for different sections
  const [complianceOverview, setComplianceOverview] = useState<ComplianceOverview | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [complianceReports, setComplianceReports] = useState<any[]>([]);
  const [dataRequests, setDataRequests] = useState<any[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);

  // Dialog states
  const [generateReportOpen, setGenerateReportOpen] = useState(false);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [riskAssessmentOpen, setRiskAssessmentOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'compliance_officer') {
      loadComplianceData();
    }
  }, [user]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, auditRes, reportsRes, requestsRes, riskRes, policiesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/compliance/overview`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/compliance/audit/events?limit=50`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/compliance/reports`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/compliance/data-rights/requests`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/compliance/risk/assessments`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/compliance/policies`, { headers: getAuthHeaders() }),
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setComplianceOverview(overviewData.data);
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditEvents(auditData.data.events || []);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setComplianceReports(reportsData.data || []);
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setDataRequests(requestsData.data || []);
      }

      if (riskRes.ok) {
        const riskData = await riskRes.json();
        setRiskAssessments(riskData.data || []);
      }

      if (policiesRes.ok) {
        const policiesData = await policiesRes.json();
        setPolicies(policiesData.data || []);
      }
    } catch (err) {
      setError('Failed to load compliance data');
      console.error('Compliance data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': case 'success': case 'completed': return 'success';
      case 'partially_compliant': case 'warning': case 'in_progress': return 'warning';
      case 'non_compliant': case 'failure': case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': case 'success': case 'completed': return <CheckIcon color="success" />;
      case 'partially_compliant': case 'warning': case 'in_progress': return <ErrorIcon color="warning" />;
      case 'non_compliant': case 'failure': case 'failed': return <ErrorIcon color="error" />;
      default: return null;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const generateReport = async (reportData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/reports/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        await loadComplianceData();
        setGenerateReportOpen(false);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  const downloadReport = async (reportId: string, format: string = 'pdf') => {
    try {
      const response = await fetch(`${API_BASE_URL}/compliance/reports/${reportId}/download?format=${format}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const downloadData = await response.json();
        // In a real app, this would trigger the actual download
        console.log('Download prepared:', downloadData.data);
      }
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'compliance_officer')) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Access denied. Compliance officer or admin privileges required.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ComplianceIcon fontSize="large" />
        Compliance & Audit Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" icon={<ComplianceIcon />} />
        <Tab label="Audit Trail" icon={<AuditIcon />} />
        <Tab label="Reports" icon={<ReportIcon />} />
        <Tab label="Data Rights" icon={<PersonIcon />} />
        <Tab label="Risk Assessment" icon={<RiskIcon />} />
        <Tab label="Policies" icon={<PolicyIcon />} />
      </Tabs>

      {/* Overview Tab */}
      {currentTab === 0 && complianceOverview && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Overall Compliance Score</Typography>
                <Typography variant="h3" color="primary">
                  {complianceOverview.complianceScore}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={complianceOverview.complianceScore} 
                  sx={{ mt: 1, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Last assessment: {new Date(complianceOverview.lastAssessment).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Audit Activity</Typography>
                <Typography variant="h3" color="primary">
                  {complianceOverview.auditEvents.total.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {complianceOverview.auditEvents.lastHour} in the last hour
                </Typography>
                <Typography variant="body2" color="error.main">
                  {complianceOverview.auditEvents.highRisk} high-risk events
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Critical Findings</Typography>
                <Typography variant="h3" color="error.main">
                  {complianceOverview.criticalFindings}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Require immediate attention
                </Typography>
                <Typography variant="body2" color="warning.main">
                  {complianceOverview.pendingRequests} pending data requests
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Regulatory Compliance Status</Typography>
                <Grid container spacing={3}>
                  {Object.entries(complianceOverview.regulations).map(([regulation, status]) => (
                    <Grid item xs={12} sm={4} key={regulation}>
                      <Box p={2} border={1} borderColor="divider" borderRadius={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          {getStatusIcon(status.status)}
                          <Typography variant="h6" textTransform="uppercase">
                            {regulation}
                          </Typography>
                        </Box>
                        <Typography variant="h4" color="primary" gutterBottom>
                          {status.score}%
                        </Typography>
                        <Chip
                          label={status.status.replace('_', ' ')}
                          color={getStatusColor(status.status) as any}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Last audit: {new Date(status.lastAudit).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Data Subject Rights</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="h3" color="warning.main">
                      {complianceOverview.dataSubjectRights.pendingRequests}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Requests
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h3" color="info.main">
                      {complianceOverview.dataSubjectRights.averageResponseTime}d
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Response Time
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h3" color="error.main">
                      {complianceOverview.dataSubjectRights.overdueTasks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overdue Tasks
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                <Box display="flex" gap={1} flexDirection="column">
                  <Button
                    variant="outlined"
                    startIcon={<ReportIcon />}
                    onClick={() => setGenerateReportOpen(true)}
                  >
                    Generate Compliance Report
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AuditIcon />}
                    onClick={() => setCurrentTab(1)}
                  >
                    View Audit Trail
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RiskIcon />}
                    onClick={() => setRiskAssessmentOpen(true)}
                  >
                    New Risk Assessment
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Audit Trail Tab */}
      {currentTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Audit Event Log</Typography>
            <Box display="flex" gap={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Risk Level</InputLabel>
                <Select value="" label="Risk Level">
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Outcome</InputLabel>
                <Select value="" label="Outcome">
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="failure">Failure</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Outcome</TableCell>
                    <TableCell>Risk Level</TableCell>
                    <TableCell>Compliance Flags</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(event.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {event.userEmail}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.userRole}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {event.action.replace(/_/g, ' ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {event.resource.replace(/_/g, ' ')}
                          </Typography>
                          <Chip label={event.resourceType} size="small" variant="outlined" />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(event.outcome)}
                          <Chip
                            label={event.outcome}
                            color={getStatusColor(event.outcome) as any}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.riskLevel}
                          color={getRiskColor(event.riskLevel) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {event.complianceFlags.slice(0, 2).map((flag) => (
                            <Chip key={flag} label={flag} size="small" variant="outlined" />
                          ))}
                          {event.complianceFlags.length > 2 && (
                            <Chip label={`+${event.complianceFlags.length - 2}`} size="small" />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* Reports Tab */}
      {currentTab === 2 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Compliance Reports</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setGenerateReportOpen(true)}
            >
              Generate Report
            </Button>
          </Box>

          <Grid container spacing={3}>
            {complianceReports.map((report) => (
              <Grid item xs={12} md={6} key={report.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{report.title}</Typography>
                      <Chip
                        label={report.status}
                        color={getStatusColor(report.status) as any}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {report.description}
                    </Typography>
                    
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>Report Details</Typography>
                      <Typography variant="body2">
                        Type: {report.type.toUpperCase()}
                      </Typography>
                      <Typography variant="body2">
                        Period: {new Date(report.period.startDate).toLocaleDateString()} - {new Date(report.period.endDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        Generated: {new Date(report.generatedAt).toLocaleDateString()}
                      </Typography>
                    </Box>

                    {report.summary && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>Summary</Typography>
                        <Typography variant="body2">
                          Compliance Score: {report.summary.complianceScore}%
                        </Typography>
                        <Typography variant="body2">
                          Critical Findings: {report.summary.criticalFindings}
                        </Typography>
                        <Typography variant="body2">
                          Total Events: {report.summary.totalEvents.toLocaleString()}
                        </Typography>
                      </Box>
                    )}

                    <Box mt={2} display="flex" gap={1}>
                      {report.status === 'completed' && (
                        <>
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => downloadReport(report.id, 'pdf')}
                          >
                            PDF
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => downloadReport(report.id, 'xlsx')}
                          >
                            Excel
                          </Button>
                        </>
                      )}
                      <Button size="small" startIcon={<AuditIcon />}>
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Data Rights Tab */}
      {currentTab === 3 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Data Subject Rights Requests</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateRequestOpen(true)}
            >
              New Request
            </Button>
          </Box>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request Type</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Requested Date</TableCell>
                    <TableCell>Deadline</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Chip label={request.requestType} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{request.subjectEmail}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.subjectType}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={new Date(request.responseDeadline) < new Date() ? 'error.main' : 'text.primary'}
                        >
                          {new Date(request.responseDeadline).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.priority}
                          color={getRiskColor(request.priority) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{request.assignedTo || 'Unassigned'}</TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* Risk Assessment Tab */}
      {currentTab === 4 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Risk Assessments</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setRiskAssessmentOpen(true)}
            >
              New Assessment
            </Button>
          </Box>

          <Grid container spacing={3}>
            {riskAssessments.map((assessment) => (
              <Grid item xs={12} md={6} key={assessment.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{assessment.title}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {assessment.description}
                    </Typography>
                    
                    <Box display="flex" gap={2} alignItems="center" mt={2} mb={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Risk Score</Typography>
                        <Typography variant="h4" color="error.main">
                          {assessment.riskScore}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Likelihood</Typography>
                        <Typography variant="h6">{assessment.likelihood}/5</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Impact</Typography>
                        <Typography variant="h6">{assessment.impact}/5</Typography>
                      </Box>
                    </Box>

                    <Chip label={assessment.category} size="small" sx={{ mr: 1 }} />
                    <Chip
                      label={assessment.status}
                      color={getStatusColor(assessment.status) as any}
                      size="small"
                    />

                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>Mitigation Controls</Typography>
                      {assessment.mitigationControls.map((control: any, index: number) => (
                        <Box key={index} display="flex" alignItems="center" gap={1}>
                          <CheckIcon fontSize="small" color={control.implemented ? 'success' : 'disabled'} />
                          <Typography variant="body2">
                            {control.description}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Box mt={2} display="flex" gap={1}>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                      <Button size="small" startIcon={<ScheduleIcon />}>
                        Review
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Policies Tab */}
      {currentTab === 5 && (
        <Box>
          <Typography variant="h6" gutterBottom>Compliance Policies</Typography>
          
          <Grid container spacing={3}>
            {policies.map((policy) => (
              <Grid item xs={12} key={policy.id}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <Typography variant="h6">{policy.name}</Typography>
                      <Chip label={`v${policy.version}`} size="small" />
                      <Chip
                        label={policy.status}
                        color={getStatusColor(policy.status) as any}
                        size="small"
                      />
                      <Box flexGrow={1} />
                      <Typography variant="body2" color="text.secondary">
                        Review: {new Date(policy.reviewDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="body1" gutterBottom>
                          {policy.description}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Requirements
                        </Typography>
                        {policy.requirements.map((req: any) => (
                          <Box key={req.id} display="flex" alignItems="center" gap={1} mb={1}>
                            <CheckIcon fontSize="small" color={req.implemented ? 'success' : 'warning'} />
                            <Typography variant="body2">
                              {req.description}
                            </Typography>
                            {req.mandatory && <Chip label="Mandatory" size="small" color="error" />}
                          </Box>
                        ))}
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>Policy Details</Typography>
                        <Typography variant="body2">
                          <strong>Type:</strong> {policy.type}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Owner:</strong> {policy.owner}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Approver:</strong> {policy.approver}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Effective:</strong> {new Date(policy.effectiveDate).toLocaleDateString()}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Related Regulations
                        </Typography>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {policy.relatedRegulations.map((reg: string) => (
                            <Chip key={reg} label={reg.toUpperCase()} size="small" />
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Generate Report Dialog */}
      <Dialog open={generateReportOpen} onClose={() => setGenerateReportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Compliance Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select value="hipaa" label="Report Type">
                  <MenuItem value="hipaa">HIPAA Compliance</MenuItem>
                  <MenuItem value="gdpr">GDPR Compliance</MenuItem>
                  <MenuItem value="soc2">SOC 2 Assessment</MenuItem>
                  <MenuItem value="iso27001">ISO 27001</MenuItem>
                  <MenuItem value="custom">Custom Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Report Title"
                fullWidth
                defaultValue="Q4 2024 Compliance Assessment"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                defaultValue="2024-10-01"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                defaultValue="2024-12-31"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                placeholder="Optional description for this compliance report"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateReportOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => generateReport({ 
              type: 'hipaa', 
              title: 'Q4 2024 Compliance Assessment',
              startDate: '2024-10-01',
              endDate: '2024-12-31'
            })}
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Data Request Dialog */}
      <Dialog open={createRequestOpen} onClose={() => setCreateRequestOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Data Subject Request</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Request Type</InputLabel>
                <Select value="access" label="Request Type">
                  <MenuItem value="access">Data Access Request</MenuItem>
                  <MenuItem value="rectification">Data Rectification</MenuItem>
                  <MenuItem value="erasure">Data Erasure (Right to be Forgotten)</MenuItem>
                  <MenuItem value="portability">Data Portability</MenuItem>
                  <MenuItem value="restriction">Processing Restriction</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Subject Email"
                fullWidth
                type="email"
                placeholder="patient@example.com"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Subject Type</InputLabel>
                <Select value="patient" label="Subject Type">
                  <MenuItem value="patient">Patient</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the data subject's request in detail"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select value="medium" label="Priority">
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRequestOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setCreateRequestOpen(false)}>
            Create Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceAuditPage;