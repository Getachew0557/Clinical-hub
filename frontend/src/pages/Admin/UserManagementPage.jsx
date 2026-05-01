import React, { useState, useEffect } from 'react';
import {
    Typography, Card, CardContent, Box, Button, Chip,
    CircularProgress, Alert, Avatar, IconButton, Menu, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Grid, Select, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TablePagination, Tabs, Tab
} from '@mui/material';
import {
    Users, UserPlus, Search, MoreHorizontal, UserCheck,
    UserMinus, Trash2, Key, Mail, Shield, X, Save
} from 'lucide-react';
import authService from '../../api/auth.service';
import { useSelector } from 'react-redux';

const ROLE_COLORS = {
    Admin:        { bg: '#fef2f2', text: '#dc2626', chip: 'error' },
    Doctor:       { bg: '#f0fdf4', text: '#15803d', chip: 'success' },
    Receptionist: { bg: '#eff6ff', text: '#1d4ed8', chip: 'primary' },
    Patient:      { bg: '#fffbeb', text: '#d97706', chip: 'warning' },
};

export default function UserManagementPage() {
    const { user: currentUser } = useSelector(s => s.auth);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Add user modal
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({ fullName: '', email: '', password: '', role: 'Patient' });
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');

    // Reset password modal
    const [resetOpen, setResetOpen] = useState(false);
    const [resetUser, setResetUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    // Menu
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await authService.getAllUsers();
            setUsers(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const ROLES = ['All', 'Admin', 'Doctor', 'Receptionist', 'Patient'];

    const filtered = users.filter(u => {
        const matchRole = roleFilter === 'All' || u.role === roleFilter;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            u.fullName?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q);
        return matchRole && matchSearch;
    });

    const handleMenuOpen = (e, user) => { setAnchorEl(e.currentTarget); setSelectedUser(user); };
    const handleMenuClose = () => { setAnchorEl(null); };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setAddLoading(true); setAddError('');
        try {
            await authService.register(addForm);
            setAddOpen(false);
            setAddForm({ fullName: '', email: '', password: '', role: 'Patient' });
            fetchUsers();
        } catch (err) {
            setAddError(err.response?.data?.message || 'Failed to create user');
        } finally { setAddLoading(false); }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) return;
        setResetLoading(true);
        try {
            // Use seed-admin endpoint for admin, or a direct update
            // For now we use the forgot-password flow to generate a token
            // In production this would be an admin-only endpoint
            alert(`Password reset for ${resetUser?.email} — in production this would send a reset email or use an admin API.`);
            setResetOpen(false);
            setNewPassword('');
        } catch { /* ignore */ } finally { setResetLoading(false); }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser || selectedUser.id === currentUser?.id) {
            alert("You can't delete your own account.");
            handleMenuClose(); return;
        }
        if (!window.confirm(`Delete ${selectedUser.fullName}? This cannot be undone.`)) { handleMenuClose(); return; }
        try {
            // Auth service delete — would need a DELETE /api/auth/:id endpoint
            // For now show a message
            alert('User deletion requires a backend DELETE endpoint. Contact your system administrator.');
        } catch { /* ignore */ }
        handleMenuClose();
    };

    const roleCounts = ROLES.slice(1).reduce((acc, r) => {
        acc[r] = users.filter(u => u.role === r).length;
        return acc;
    }, {});

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
            <div className="flex flex-col gap-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Typography variant="h5" fontWeight={700} color="text.primary">User Management</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {users.length} total users across all roles
                        </Typography>
                    </div>
                    <Button variant="contained" startIcon={<UserPlus size={16} />}
                        onClick={() => setAddOpen(true)} sx={{ borderRadius: 3 }}>
                        Add User
                    </Button>
                </div>

                {/* Role summary tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(roleCounts).map(([role, count]) => {
                        const meta = ROLE_COLORS[role] || ROLE_COLORS.Patient;
                        return (
                            <button key={role} onClick={() => setRoleFilter(role)}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                    roleFilter === role ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}>
                                <Typography variant="h4" fontWeight={800} sx={{ color: meta.text }}>{count}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {role}s
                                </Typography>
                            </button>
                        );
                    })}
                </div>

                {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

                {/* Table */}
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                    <CardContent sx={{ p: 0 }}>
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100">
                            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 flex-1 max-w-sm">
                                <Search size={16} className="text-slate-400" />
                                <input placeholder="Search by name or email..."
                                    className="bg-transparent text-sm outline-none flex-1"
                                    value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {ROLES.map(r => (
                                    <button key={r} onClick={() => { setRoleFilter(r); setPage(0); }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                            roleFilter === r
                                                ? 'bg-teal-600 text-white border-teal-600'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                                        }`}>
                                        {r} {r !== 'All' && `(${roleCounts[r] || 0})`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center p-12"><CircularProgress size={32} /></div>
                        ) : (
                            <>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                                                    <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', py: 1.5, px: 2 }}>
                                                        {h}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(u => {
                                                const meta = ROLE_COLORS[u.role] || ROLE_COLORS.Patient;
                                                return (
                                                    <TableRow key={u.id} hover>
                                                        <TableCell sx={{ px: 2, py: 1.5 }}>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar sx={{ width: 32, height: 32, bgcolor: meta.bg, color: meta.text, fontWeight: 800, fontSize: '0.8rem' }}>
                                                                    {u.fullName?.charAt(0)}
                                                                </Avatar>
                                                                <div>
                                                                    <Typography variant="body2" fontWeight={600}>{u.fullName}</Typography>
                                                                    {u.id === currentUser?.id && (
                                                                        <Typography variant="caption" sx={{ color: '#0d9488', fontWeight: 700 }}>You</Typography>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell sx={{ px: 2 }}>
                                                            <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ px: 2 }}>
                                                            <Chip label={u.role} size="small" color={meta.chip}
                                                                variant="outlined" sx={{ fontWeight: 700, borderRadius: 2, fontSize: '0.7rem' }} />
                                                        </TableCell>
                                                        <TableCell sx={{ px: 2 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ px: 2 }}>
                                                            <IconButton size="small" onClick={e => handleMenuOpen(e, u)}>
                                                                <MoreHorizontal size={16} />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {filtered.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                                                        <Users size={32} className="mx-auto mb-2 opacity-30" />
                                                        <Typography variant="body2">No users found.</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    component="div"
                                    count={filtered.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={(_, p) => setPage(p)}
                                    onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Context Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
                PaperProps={{ sx: { borderRadius: 3, minWidth: 180, mt: 1 } }}>
                <MenuItem onClick={() => { setResetUser(selectedUser); setResetOpen(true); handleMenuClose(); }}
                    sx={{ gap: 1.5, py: 1.2 }}>
                    <Key size={15} className="text-blue-500" />
                    <span className="text-sm font-medium">Reset Password</span>
                </MenuItem>
                <MenuItem onClick={() => { alert(`Send password reset email to ${selectedUser?.email}`); handleMenuClose(); }}
                    sx={{ gap: 1.5, py: 1.2 }}>
                    <Mail size={15} className="text-teal-500" />
                    <span className="text-sm font-medium">Send Reset Email</span>
                </MenuItem>
                <MenuItem onClick={handleDeleteUser} sx={{ gap: 1.5, py: 1.2, color: 'error.main' }}>
                    <Trash2 size={15} />
                    <span className="text-sm font-medium">Delete User</span>
                </MenuItem>
            </Menu>

            {/* Add User Modal */}
            <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}>
                <form onSubmit={handleAddUser}>
                    <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', p: 3 }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                                    <UserPlus size={20} className="text-teal-600" />
                                </div>
                                <Typography variant="h6" fontWeight={700}>Add New User</Typography>
                            </div>
                            <IconButton size="small" onClick={() => setAddOpen(false)}><X size={18} /></IconButton>
                        </div>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                        {addError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{addError}</Alert>}
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={12}>
                                <TextField label="Full Name" fullWidth required value={addForm.fullName}
                                    onChange={e => setAddForm(p => ({ ...p, fullName: e.target.value }))} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Email" type="email" fullWidth required value={addForm.email}
                                    onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Password" type="password" fullWidth required value={addForm.password}
                                    onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Role</InputLabel>
                                    <Select value={addForm.role} label="Role"
                                        onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))}>
                                        {['Patient', 'Doctor', 'Receptionist', 'Admin'].map(r => (
                                            <MenuItem key={r} value={r}>{r}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', gap: 1.5 }}>
                        <Button color="inherit" onClick={() => setAddOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={addLoading}
                            startIcon={<Save size={16} />} sx={{ borderRadius: 3 }}>
                            {addLoading ? 'Creating...' : 'Create User'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Reset Password Modal */}
            <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700}>Reset Password</Typography>
                    <Typography variant="body2" color="text.secondary">{resetUser?.email}</Typography>
                </DialogTitle>
                <DialogContent sx={{ px: 3, pb: 1 }}>
                    <TextField label="New Password" type="password" fullWidth
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        helperText="Minimum 8 characters" />
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1.5 }}>
                    <Button color="inherit" onClick={() => setResetOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleResetPassword} disabled={resetLoading || newPassword.length < 6}
                        sx={{ borderRadius: 3 }}>
                        {resetLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
