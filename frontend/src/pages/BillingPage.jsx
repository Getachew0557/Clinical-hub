import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
    Typography, Card, CardContent, Grid,
    Box, Chip, CircularProgress, Alert, Divider, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, IconButton
} from '@mui/material';
import { 
    Receipt, CreditCard, ChevronRight, AlertCircle, 
    Clock, CheckCircle2, Upload, X, FileText, Camera
} from 'lucide-react';
import billingService from '../api/billing.service.js';

const API_URL = import.meta.env.VITE_API_BILLING_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const BillingPage = () => {
    const { t } = useTranslation();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(null); 
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [proofFile, setProofFile] = useState(null);
    const [proofPreview, setProofPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        fetchInvoices();
    }, [user]);

    const fetchInvoices = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const data = await billingService.getPatientInvoices(user.id);
            setInvoices(Array.isArray(data) ? data : []);
        } catch (err) {
            const status = err.response?.status;
            console.error('Billing fetch error:', status, err.message);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenUpload = (invoice) => {
        setSelectedInvoice(invoice);
        setProofFile(null);
        setProofPreview(null);
        setUploadDialogOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProofFile(file);
            setProofPreview(URL.createObjectURL(file));
        }
    };

    const handleUploadProof = async () => {
        if (!proofFile || !selectedInvoice) return;
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('proof', proofFile);
            formData.append('invoiceId', selectedInvoice.id);
            formData.append('amount', selectedInvoice.amount);
            formData.append('method', 'Manual Transfer');

            await billingService.submitProof(formData);
            
            fetchInvoices();
            setUploadDialogOpen(false);
            // In a real app, use a proper snackbar/toast for notifications
            alert(t('billing.notifySuccess')); 
        } catch (err) {
            alert(t('billing.notifyFailed'));
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const totalPaid    = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const totalPending = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + parseFloat(i.amount || 0), 0);

    if (loading) {
        return (
            <Box className="flex h-64 items-center justify-center">
                <CircularProgress size={32} />
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
            <Box className="flex flex-col gap-6">

                {/* Header */}
                <Box>
                    <Typography variant="h5" fontWeight={900} color="text.primary">
                        {t('billing.myBills')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {t('billing.myBillsDesc')}
                    </Typography>
                </Box>

                {error && (
                    <Alert
                        severity="error"
                        icon={<AlertCircle size={20} />}
                        sx={{ borderRadius: 3 }}
                        action={
                            <Button color="inherit" size="small" onClick={fetchInvoices}>
                                {t('common.retry')}
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {/* Summary tiles */}
                {invoices.length > 0 && (
                    <Grid container spacing={3}>
                        {[
                            { label: t('billing.totalPaid'), value: totalPaid, color: '#059669', bg: '#f0fdf4', icon: CheckCircle2 },
                            { label: t('billing.outstanding'), value: totalPending, color: '#d97706', bg: '#fffbeb', icon: Clock },
                        ].map(tile => (
                            <Grid item xs={12} sm={6} key={tile.label}>
                                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                    <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: tile.bg, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <tile.icon size={22} style={{ color: tile.color }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {tile.label}
                                            </Typography>
                                            <Typography variant="h5" fontWeight={800} color="text.primary">
                                                ETB {tile.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Invoice list */}
                <Grid container spacing={3}>
                    {invoices.length === 0 ? (
                        <Grid item xs={12}>
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5, bgcolor: '#f8fafc' }}>
                                <CardContent className="flex flex-col items-center justify-center p-12 text-slate-400">
                                    <Receipt size={48} className="mb-4 opacity-20" />
                                    <Typography variant="body1" fontWeight={600}>{t('billing.noRecords')}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        {t('billing.noInvoices')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ) : (
                        invoices.map(invoice => (
                            <Grid item xs={12} key={invoice.id}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 4,
                                        transition: 'all 0.2s',
                                        '&:hover': { borderColor: '#0d9488', boxShadow: '0 4px 12px rgba(13,148,136,0.06)' }
                                    }}
                                >
                                    <CardContent className="p-6">
                                        <Box className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <Box className="flex items-center gap-4">
                                                <Box sx={{
                                                    width: 48, height: 48, borderRadius: 3,
                                                    bgcolor: invoice.status === 'Paid' ? '#f0fdf4' : '#fffbeb',
                                                    p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Receipt size={24} style={{ color: invoice.status === 'Paid' ? '#059669' : '#d97706' }} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                                                        {invoice.description || t('common.generalConsultation')}
                                                    </Typography>
                                                    <Box className="flex items-center gap-3 mt-1">
                                                        <Box className="flex items-center gap-1 text-slate-400">
                                                            <Clock size={13} />
                                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                                {new Date(invoice.createdAt).toLocaleDateString()}
                                                            </Typography>
                                                        </Box>
                                                        <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />
                                                        <Chip
                                                            label={invoice.status === 'Paid' ? t('billing.paid') : t('billing.pending')}
                                                            size="small"
                                                            color={invoice.status === 'Paid' ? 'success' : 'warning'}
                                                            variant="outlined"
                                                            sx={{ fontWeight: 700, borderRadius: 2 }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Box className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800 }}>
                                                    ETB {parseFloat(invoice.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </Typography>

                                                {invoice.status !== 'Paid' && (
                                                    invoice.payments?.some(p => p.status === 'Pending') ? (
                                                        <Box sx={{ bgcolor: '#fffbeb', px: 2, py: 1, borderRadius: 2, border: '1px dashed #d97706', textAlign: 'center' }}>
                                                            <Typography variant="caption" color="#d97706" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                                <Clock size={14} /> {t('billing.underReview')}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Button
                                                            variant="contained"
                                                            startIcon={<Camera size={18} />}
                                                            onClick={() => handleOpenUpload(invoice)}
                                                            sx={{ borderRadius: 3, px: 3, bgcolor: '#0d9488', '&:hover': { bgcolor: '#0f766e' } }}
                                                        >
                                                            {t('billing.uploadReceipt')}
                                                        </Button>
                                                    )
                                                )}

                                                {invoice.status === 'Paid' && (
                                                    <Chip
                                                        icon={<CheckCircle2 size={14} />}
                                                        label={t('billing.paid')}
                                                        color="success"
                                                        variant="filled"
                                                        sx={{ fontWeight: 700, borderRadius: 2 }}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            </Box>

            {/* Upload Proof Dialog */}
            <Dialog 
                open={uploadDialogOpen} 
                onClose={() => setUploadDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle className="flex justify-between items-center">
                    <Typography variant="h6" fontWeight={800}>{t('billing.submitProof')}</Typography>
                    <IconButton onClick={() => setUploadDialogOpen(false)}><X size={20} /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('billing.uploadProofDesc')}
                    </Typography>

                    <Box 
                        onClick={() => document.getElementById('proof-input').click()}
                        sx={{ 
                            border: '2px dashed #e2e8f0', 
                            borderRadius: 3, 
                            p: 3, 
                            textAlign: 'center',
                            cursor: 'pointer',
                            bgcolor: '#f8fafc',
                            '&:hover': { borderColor: '#0d9488', bgcolor: '#f0fdfa' },
                            transition: 'all 0.2s'
                        }}
                    >
                        {proofPreview ? (
                            <img src={proofPreview} alt="Receipt" className="max-h-40 mx-auto rounded-lg shadow-sm" />
                        ) : (
                            <Box className="flex flex-col items-center gap-2">
                                <Upload size={32} className="text-slate-400" />
                                <Typography variant="caption" fontWeight={600} color="text.secondary">
                                    {t('billing.clickToUpload')}
                                </Typography>
                            </Box>
                        )}
                        <input 
                            id="proof-input" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileChange} 
                        />
                    </Box>

                    {selectedInvoice && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-slate-500">{t('billing.invoiceId')}</span>
                                <span className="font-bold">#{selectedInvoice.id?.slice(-8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">{t('billing.totalAmount')}</span>
                                <span className="font-bold text-teal-600">ETB {parseFloat(selectedInvoice.amount).toLocaleString()}</span>
                            </div>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setUploadDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>{t('common.cancel')}</Button>
                    <Button 
                        onClick={handleUploadProof} 
                        variant="contained" 
                        disabled={!proofFile || uploading}
                        sx={{ borderRadius: 2, px: 4, bgcolor: '#0d9488', fontWeight: 700 }}
                    >
                        {uploading ? <CircularProgress size={20} color="inherit" /> : t('billing.submitProof')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BillingPage;

