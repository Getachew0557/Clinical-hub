import React, { useState, useEffect } from 'react';
import {
    Search, UserPlus, Mail, Phone,
    MoreHorizontal, UserCheck, UserMinus,
    X, Save, ShieldCheck
} from 'lucide-react';
import {
    Typography, Button, Card, CardContent, InputBase,
    Avatar, Chip, IconButton, Menu, MenuItem,
    CircularProgress, Alert, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid, Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import authService from '../../api/auth.service';

export default function ReceptionistListPage() {
    const { t } = useTranslation();
    const [receptionists, setReceptionists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchReceptionists();
    }, []);

    const fetchReceptionists = async () => {
        try {
            setLoading(true);
            const allUsers = await authService.getAllUsers();
            // Filter only receptionists
            const filtered = allUsers.filter(u => u.role === 'Receptionist');
            setReceptionists(filtered);
            setError(null);
        } catch (err) {
            console.error('Fetch Receptionists Error:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({ fullName: '', email: '', password: '' });
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await authService.register({
                ...formData,
                role: 'Receptionist'
            });
            alert(t('admin.broadcast.success', { count: 1 }));
            handleCloseModal();
            fetchReceptionists();
        } catch (err) {
            alert(err.response?.data?.message || t('common.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleMenuOpen = (event, user) => {
        setAnchorEl(event.currentTarget);
        setSelectedUser(user);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const filteredList = receptionists.filter(r =>
        r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
            <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Typography variant="h5" fontWeight={900} color="text.primary">{t('admin.receptionist.title')}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {t('admin.receptionist.subtitle')}
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<UserPlus size={18} />}
                    sx={{ borderRadius: 3 }}
                    onClick={handleOpenModal}
                >
                    {t('admin.receptionist.add')}
                </Button>
            </div>

            {/* ── Search ── */}
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                <CardContent className="py-4 px-5">
                    <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-2 border border-slate-100 focus-within:border-teal-500 focus-within:bg-white transition-all max-w-md">
                        <Search size={18} className="text-slate-400" />
                        <InputBase
                            placeholder={t('admin.userMgmt.searchPlaceholder')}
                            className="w-full text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <CircularProgress size={32} />
                </div>
            ) : error ? (
                <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredList.map((rec) => (
                        <Card
                            key={rec.id}
                            elevation={0}
                            sx={{
                                border: '1px solid #e2e8f0',
                                borderRadius: 5,
                                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                            }}
                        >
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <Avatar sx={{ bgcolor: '#f1f5f9', color: '#0d9488', fontWeight: 800 }}>
                                        {rec.fullName.charAt(0)}
                                    </Avatar>
                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, rec)} sx={{ mr: -1, mt: -1 }}>
                                        <MoreHorizontal size={18} />
                                    </IconButton>
                                </div>
                                <Typography variant="subtitle1" color="text.primary" className="truncate" fontWeight={700}>{rec.fullName}</Typography>
                                <div className="flex items-center gap-2 text-slate-500 mt-2">
                                    <Mail size={14} />
                                    <Typography variant="caption" className="truncate">{rec.email}</Typography>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-50">
                                    <Chip
                                        label={t('common.role')}
                                        size="small"
                                        icon={<ShieldCheck size={14} />}
                                        sx={{ bgcolor: '#f0fdf4', color: '#166534', fontWeight: 800, border: '1px solid #dcfce7' }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredList.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-400">
                            <ShieldCheck size={48} className="opacity-20 mb-4" />
                            <Typography variant="body1">{t('admin.receptionist.noStaff')}</Typography>
                        </div>
                    )}
                </div>
            )}

            {/* ── Add Modal ── */}
            <Dialog
                open={modalOpen}
                onClose={handleCloseModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, mt: 4 } }}
            >
                <form onSubmit={handleSubmit}>
                    <DialogTitle sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
                        <Typography variant="h6" fontWeight={800}>{t('admin.receptionist.add')}</Typography>
                    </DialogTitle>
                    <DialogContent sx={{ p: 4 }}>
                        <div className="pt-2">
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block', fontWeight: 700 }}>
                                            {t('common.fullName')}
                                        </Typography>
                                        <TextField
                                            name="fullName"
                                            fullWidth
                                            required
                                            placeholder="Enter receptionist full name"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block', fontWeight: 700 }}>
                                            {t('common.email')}
                                        </Typography>
                                        <TextField
                                            name="email"
                                            type="email"
                                            fullWidth
                                            required
                                            placeholder="receptionist@clinic.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block', fontWeight: 700 }}>
                                            {t('common.password')}
                                        </Typography>
                                        <TextField
                                            name="password"
                                            type="password"
                                            fullWidth
                                            required
                                            placeholder="Set temporary password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </div>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9' }}>
                        <Button color="inherit" onClick={handleCloseModal} sx={{ fontWeight: 600 }}>{t('common.cancel')}</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submitting}
                            sx={{ borderRadius: 3, px: 4, bgcolor: '#0d9488', '&:hover': { bgcolor: '#0f766e' } }}
                        >
                            {submitting ? t('common.saving') : t('admin.userMgmt.createUser')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleMenuClose}>{t('admin.deactivate')}</MenuItem>
                <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>{t('admin.deleteUser')}</MenuItem>
            </Menu>
            </div>
        </Box>
    );
}
