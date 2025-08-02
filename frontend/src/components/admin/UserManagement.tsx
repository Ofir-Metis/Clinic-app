/**
 * UserManagement - User and subscriber management component
 */

import React, { useState } from 'react';
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
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Block as SuspendIcon,
  CheckCircle as ActivateIcon,
  Person as UserIcon,
  Psychology as TherapistIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useAdminData } from '../../hooks/useAdminData';

interface UserManagementProps {
  users: any;
  loading: boolean;
  onRefresh: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  loading,
  onRefresh,
}) => {
  const { updateUserStatus, updateSubscription } = useAdminData();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [statusReason, setStatusReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!users) return null;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: any) => {
    setMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedUser(null);
  };

  const handleStatusChange = () => {
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
    setNewStatus('active');
    setStatusReason('');
    setError(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    setError(null);

    try {
      await updateUserStatus(selectedUser.id, newStatus, statusReason);
      handleStatusDialogClose();
      onRefresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminIcon color="error" />;
      case 'coach':
        return <TherapistIcon color="primary" />;
      case 'client':
        return <UserIcon color="info" />;
      default:
        return <UserIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const paginatedUsers = users.users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {users.stats.totalUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {users.stats.activeUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {users.stats.therapists}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Therapists
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                {users.stats.clients}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Clients
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            User Management
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Subscription</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((user: any) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                          {getRoleIcon(user.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={user.role === 'admin' ? 'error' : user.role === 'coach' ? 'primary' : 'info'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        size="small"
                        color={getStatusColor(user.status) as any}
                        variant={user.status === 'active' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(user.lastLogin)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {user.subscription ? (
                        <Box>
                          <Chip
                            label={user.subscription.plan}
                            size="small"
                            color={user.subscription.status === 'active' ? 'success' : 'default'}
                            variant="outlined"
                          />
                          <Typography variant="caption" display="block" color="text.secondary">
                            Expires: {formatDate(user.subscription.expiresAt)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(user.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="User Actions">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, user)}
                          size="small"
                        >
                          <MoreIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={users.users.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>

      {/* User Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleStatusChange}>
          <EditIcon sx={{ mr: 1 }} />
          Change Status
        </MenuItem>
        {selectedUser?.status === 'active' && (
          <MenuItem onClick={() => { setNewStatus('suspended'); handleStatusChange(); }}>
            <SuspendIcon sx={{ mr: 1 }} />
            Suspend User
          </MenuItem>
        )}
        {selectedUser?.status !== 'active' && (
          <MenuItem onClick={() => { setNewStatus('active'); handleStatusChange(); }}>
            <ActivateIcon sx={{ mr: 1 }} />
            Activate User
          </MenuItem>
        )}
      </Menu>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleStatusDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Change User Status
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Changing status for: <strong>{selectedUser?.email}</strong>
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              label="New Status"
              onChange={(e) => setNewStatus(e.target.value as any)}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Reason (optional)"
            multiline
            rows={3}
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="Enter reason for status change..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;