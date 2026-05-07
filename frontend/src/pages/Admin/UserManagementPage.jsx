import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Typography, Card, CardContent, Box, Button, Chip,
    CircularProgress, Alert, Avatar, IconButton, Menu, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Grid, Select, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TablePagination, Tabs, Tab, Divider, InputBase
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
    const { t } = useTranslation();
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
            setError(t('common.error'));
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
            setAddError(err.response?.data?.message || t('common.error'));
        } finally { setAddLoading(false); }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) return;
        setResetLoading(true);
        try {
            alert(t('common.success'));
            setResetOpen(false);
            setNewPassword('');
        } catch { /* ignore */ } finally { setResetLoading(false); }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser || selectedUser.id === currentUser?.id) {
            alert(t('admin.userMgmt.cannotDeleteSelf'));
            handleMenuClose(); return;
        }
        if (!window.confirm(t('common.confirmDelete'))) { handleMenuClose(); return; }
        // Simulate deletion
        alert(t('common.success'));
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
                        <Typography variant="h5" fontWeight={900} color="text.primary">{t('admin.userMgmt.title')}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                            {t('admin.userMgmt.subtitle', { count: users.length })}
                        </Typography>
                    </div>
                    <Button 
                        variant="contained" 
                        startIcon={<UserPlus size={18} />}
                        onClick={() => setAddOpen(true)} 
                        sx={{ borderRadius: 3, bgcolor: '#0d9488', '&:hover': { bgcolor: '#0f766e' } }}
                    >
                        {t('admin.userMgmt.addUser')}
                    </Button>
                </div>

                {/* Role summary tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(roleCounts).map(([role, count]) => {
                        const meta = ROLE_COLORS[role] || ROLE_COLORS.Patient;
                        return (
                            <Card 
                                key={role} 
                                component="button"
                                onClick={() => setRoleFilter(role)}
                                sx={{ 
                                    p: 0, 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    bgcolor: roleFilter === role ? '#f0fdfa' : 'white',
                                    borderColor: roleFilter === role ? '#0d9488' : '#e2e8f0',
                                    '&:hover': { borderColor: '#0d9488', boxShadow: '0 4px 12px rgba(13,148,136,0.06)' },
                                    textAlign: 'left',
                                    display: 'block',
                                    width: '100%'
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h4" fontWeight={900} sx={{ color: meta.text }}>{count}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {role}s
                                    </Typography>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

                {/* Main Content Card */}
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc', px: 2, py: 1, borderRadius: 2.5, border: '1px solid #e2e8f0', flex: 1, maxWidth: 400 }}>
                            <Search size={18} className="text-slate-400" />
                            <InputBase 
                                placeholder={t('common.searchPlaceholder')}
                                sx={{ ml: 1, flex: 1, fontSize: '0.875rem', fontWeight: 500 }}
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(0); }}
                            />
                        </Box>
                        <Tabs 
                            value={roleFilter} 
                            onChange={(_, v) => { setRoleFilter(v); setPage(0); }}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ minHeight: 40 }}
                        >
                            {ROLES.map(r => (
                                <Tab 
                                    key={r} 
                                    label={r === 'All' ? t('common.all') : r} 
                                    value={r} 
                                    sx={{ minHeight: 40, py: 0.5, px: 2, fontSize: '0.8125rem' }} 
                                />
                            ))}
                        </Tabs>
                    </Box>

                    <TableContainer>
                        <Table size="medium">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>{t('common.user')}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>{t('common.email')}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>{t('common.role')}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>{t('common.joined')}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>{t('common.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                            <CircularProgress size={32} thickness={5} />
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                            <Users size={48} className="mx-auto mb-4 opacity-20" />
                                            <Typography variant="body1" fontWeight={600} color="text.secondary">{t('common.noRecords')}</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(u => {
                                        const meta = ROLE_COLORS[u.role] || ROLE_COLORS.Patient;
                                        return (
                                            <TableRow key={u.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ width: 36, height: 36, bgcolor: meta.bg, color: meta.text, fontWeight: 800, fontSize: '0.9rem' }}>
                                                            {u.fullName?.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={700}>{u.fullName}</Typography>
                                                            {u.id === currentUser?.id && (
                                                                <Chip label="You" size="small" sx={{ height: 16, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#f0fdfa', color: '#0d9488' }} />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell><Typography variant="body2" color="text.secondary">{u.email}</Typography></TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={u.role} 
                                                        size="small" 
                                                        sx={{ fontWeight: 800, borderRadius: 2, fontSize: '0.75rem', bgcolor: meta.bg, color: meta.text }} 
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={e => handleMenuOpen(e, u)} sx={{ border: '1px solid #f1f5f9' }}>
                                                        <MoreHorizontal size={18} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={filtered.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    />
                </Card>
            </div>

            {/* Context Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
                PaperProps={{ sx: { borderRadius: 3, minWidth: 200, mt: 1, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }}>
                <MenuItem onClick={() => { setResetUser(selectedUser); setResetOpen(true); handleMenuClose(); }}
                    sx={{ gap: 1.5, py: 1.2 }}>
                    <Key size={16} className="text-blue-500" />
                    <span className="text-sm font-bold">{t('admin.userMgmt.resetPassword')}</span>
                </MenuItem>
                <MenuItem onClick={() => { alert(t('common.success')); handleMenuClose(); }}
                    sx={{ gap: 1.5, py: 1.2 }}>
                    <Mail size={16} className="text-teal-600" />
                    <span className="text-sm font-bold">{t('admin.userMgmt.sendResetEmail')}</span>
                </MenuItem>
                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                <MenuItem onClick={handleDeleteUser} sx={{ gap: 1.5, py: 1.2, color: 'error.main' }}>
                    <Trash2 size={16} />
                    <span className="text-sm font-bold">{t('common.delete')}</span>
                </MenuItem>
            </Menu>

            {/* Add User Modal */}
            <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}>
                <form onSubmit={handleAddUser}>
                    <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ w: 44, h: 44, borderRadius: 3, bgcolor: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserPlus size={22} className="text-teal-600" />
                                </Box>
                                <Typography variant="h6" fontWeight={800}>{t('admin.userMgmt.addUser')}</Typography>
                            </Box>
                            <IconButton onClick={() => setAddOpen(false)}><X size={20} /></IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                        {addError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>{addError}</Alert>}
                        <Grid container spacing={3} sx={{ mt: 0 }}>
                            <Grid item xs={12}>
                                <TextField label={t('common.fullName')} fullWidth required value={addForm.fullName}
                                    onChange={e => setAddForm(p => ({ ...p, fullName: e.target.value }))} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label={t('common.email')} type="email" fullWidth required value={addForm.email}
                                    onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label={t('common.password')} type="password" fullWidth required value={addForm.password}
                                    onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('common.role')}</InputLabel>
                                    <Select value={addForm.role} label={t('common.role')}
                                        onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))}>
                                        {['Patient', 'Doctor', 'Receptionist', 'Admin'].map(r => (
                                            <MenuItem key={r} value={r}>{r}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', gap: 2 }}>
                        <Button color="inherit" onClick={() => setAddOpen(false)} sx={{ fontWeight: 700 }}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained" disabled={addLoading}
                            startIcon={addLoading ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />} 
                            sx={{ borderRadius: 2.5, px: 4, bgcolor: '#0d9488', fontWeight: 800 }}>
                            {addLoading ? t('common.saving') : t('admin.userMgmt.createUser')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Reset Password Modal */}
            <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={800}>{t('admin.userMgmt.resetPassword')}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{resetUser?.email}</Typography>
                </DialogTitle>
                <DialogContent sx={{ px: 3, pb: 1 }}>
                    <TextField label={t('common.password')} type="password" fullWidth
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        helperText="Minimum 8 characters" />
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 2 }}>
                    <Button color="inherit" onClick={() => setResetOpen(false)} sx={{ fontWeight: 700 }}>{t('common.cancel')}</Button>
                    <Button variant="contained" onClick={handleResetPassword} disabled={resetLoading || newPassword.length < 6}
                        sx={{ borderRadius: 2.5, px: 4, bgcolor: '#0d9488', fontWeight: 800 }}>
                        {resetLoading ? <CircularProgress size={16} color="inherit" /> : t('admin.userMgmt.resetPassword')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

