import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
    Typography, Grid, Chip, CircularProgress, Alert, Divider,
    IconButton, Box
} from '@mui/material';
import { 
    Receipt, CreditCard, ChevronRight, AlertCircle, 
    Clock, CheckCircle2, Upload, X, FileText, Camera
} from 'lucide-react';
import billingService from '../api/billing.service.js';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Modal, ModalContent, ModalActions } from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useToast } from '../hooks/useToast';

const API_URL = import.meta.env.VITE_API_BILLING_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const BillingPage = () => {
    const { t } = useTranslation();
    const { success: toastSuccess, error: toastError } = useToast();
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
            toastSuccess(t('billing.notifySuccess')); 
        } catch (err) {
            toastError(t('billing.notifyFailed'));
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const totalPaid    = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const totalPending = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + parseFloat(i.amount || 0), 0);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <CircularProgress size={32} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-8 pb-8 min-h-screen">

                {/* Header */}
                <div>
                    <Typography variant="h5" className="fw-800">
                        {t('billing.myBills')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className="mt-1 fw-500">
                        {t('billing.myBillsDesc')}
                    </Typography>
                </div>

                {error && (
                    <Alert
                        severity="error"
                        icon={<AlertCircle size={20} />}
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
                                <Card>
                                    <CardContent className="flex items-center gap-3 p-4">
                                        <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: tile.bg }}>
                                            <tile.icon size={22} style={{ color: tile.color }} />
                                        </div>
                                        <div>
                                            <Typography variant="caption" className="fw-700 text-theme-secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {tile.label}
                                            </Typography>
                                            <Typography variant="h5" className="fw-800">
                                                ETB {tile.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </Typography>
                                        </div>
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
                            <Card className="bg-slate-50">
                                <CardContent className="flex flex-col items-center justify-center p-12 text-slate-400">
                                    <Receipt size={48} className="mb-4 opacity-20" />
                                    <Typography variant="body1" className="fw-600">{t('billing.noRecords')}</Typography>
                                    <Typography variant="body2" color="text.secondary" className="mt-1">
                                        {t('billing.noInvoices')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ) : (
                        invoices.map(invoice => (
                            <Grid item xs={12} key={invoice.id}>
                                <Card className="hover:border-teal-300 hover:shadow-md transition-all duration-200">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
                                                    backgroundColor: invoice.status === 'Paid' ? '#f0fdf4' : '#fffbeb',
                                                }}>
                                                    <Receipt size={24} style={{ color: invoice.status === 'Paid' ? '#059669' : '#d97706' }} />
                                                </div>
                                                <div>
                                                    <Typography variant="subtitle1" className="fw-800">
                                                        {invoice.description || t('common.generalConsultation')}
                                                    </Typography>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="flex items-center gap-1 text-slate-400">
                                                            <Clock size={13} />
                                                            <Typography variant="caption" className="fw-600">
                                                                {new Date(invoice.createdAt).toLocaleDateString()}
                                                            </Typography>
                                                        </div>
                                                        <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />
                                                        <Chip
                                                            label={invoice.status === 'Paid' ? t('billing.paid') : t('billing.pending')}
                                                            size="small"
                                                            color={invoice.status === 'Paid' ? 'success' : 'warning'}
                                                            variant="outlined"
                                                            className="fw-700"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                <Typography variant="h5" className="fw-800">
                                                    ETB {parseFloat(invoice.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </Typography>

                                                {invoice.status !== 'Paid' && (
                                                    invoice.payments?.some(p => p.status === 'Pending') ? (
                                                        <div className="bg-amber-50 px-3 py-2 rounded-lg border border-dashed border-amber-600 text-center">
                                                            <Typography variant="caption" className="text-amber-600 fw-700 flex items-center justify-center gap-1">
                                                                <Clock size={14} /> {t('billing.underReview')}
                                                            </Typography>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="contained"
                                                            startIcon={<Camera size={18} />}
                                                            onClick={() => handleOpenUpload(invoice)}
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
                                                        className="fw-700"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>

                {/* Upload Proof Dialog */}
                <Modal 
                    open={uploadDialogOpen} 
                    onClose={() => setUploadDialogOpen(false)}
                    title={t('billing.submitProof')}
                    maxWidth="xs"
                >
                    <ModalContent>
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
                    </ModalContent>

                    <ModalActions
                        onCancel={() => setUploadDialogOpen(false)}
                        onConfirm={handleUploadProof}
                        confirmText={t('billing.submitProof')}
                        loading={uploading}
                    />
                </Modal>
            </div>
        );
    };

export default BillingPage;

