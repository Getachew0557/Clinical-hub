import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
            setError('Failed to load invoices. Please try again later.');
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
            
            // Refresh invoices to show updated status/payment records
            fetchInvoices();
            setUploadDialogOpen(false);
            alert('Payment proof submitted successfully! Our team will review it shortly.');
        } catch (err) {
            alert('Failed to upload proof. Please try again.');
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
                        My Bills & Invoices
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                        View and pay your outstanding clinic invoices
                    </Typography>
                </Box>

                {error && (
                    <Alert
                        severity={error === 'cold' ? 'warning' : 'error'}
                        icon={<AlertCircle size={20} />}
                        sx={{ borderRadius: 3 }}
                        action={
                            error === 'cold' ? (
                                <Button color="inherit" size="small" onClick={fetchInvoices}>
                                    Retry
                                </Button>
                            ) : null
                        }
                    >
                        {error === 'cold'
                            ? 'The billing service is starting up (Render free tier). Please wait a moment and click Retry.'
                            : error}
                    </Alert>
                )}

                {/* Summary tiles */}
                {invoices.length > 0 && (
                    <Grid container spacing={3}>
                        {[
                            { label: 'Total Paid', value: totalPaid, color: '#059669', bg: '#f0fdf4', icon: CheckCircle2 },
                            { label: 'Outstanding', value: totalPending, color: '#d97706', bg: '#fffbeb', icon: Clock },
                        ].map(tile => (
                            <Grid item xs={12} sm={6} key={tile.label}>
                                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                    <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Box sx={{ w: 44, h: 44, borderRadius: 3, bgcolor: tile.bg, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                    <Typography variant="body1" fontWeight={600}>No billing records found.</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Invoices will appear here after your appointments are completed.
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
                                        '&:hover': { borderColor: '#94a3b8', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }
                                    }}
                                >
                                    <CardContent className="p-6">
                                        <Box className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <Box className="flex items-center gap-4">
                                                <Box sx={{
                                                    w: 48, h: 48, borderRadius: 3,
                                                    bgcolor: invoice.status === 'Paid' ? '#f0fdf4' : '#fffbeb',
                                                    p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Receipt size={24} style={{ color: invoice.status === 'Paid' ? '#059669' : '#d97706' }} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                                                        {invoice.description || 'Consultation Service'}
                                                    </Typography>
                                                    <Box className="flex items-center gap-3 mt-1">
                                                        <Box className="flex items-center gap-1 text-slate-400">
                                                            <Clock size={13} />
                                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                                {new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </Typography>
                                                        </Box>
                                                        <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />
                                                        <Chip
                                                            label={invoice.status}
                                                            size="small"
                                                            color={invoice.status === 'Paid' ? 'success' : 'warning'}
                                                            variant="outlined"
                                                            sx={{ fontWeight: 700, borderRadius: 2 }}
                                                        />
                                                        {invoice.dueDate && invoice.status !== 'Paid' && (
                                                            <>
                                                                <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Due: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                                </Typography>
                                                            </>
                                                        )}
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
                                                                <Clock size={14} /> Under Review
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Button
                                                            variant="contained"
                                                            startIcon={<Camera size={18} />}
                                                            onClick={() => handleOpenUpload(invoice)}
                                                            sx={{ borderRadius: 3, px: 3, bgcolor: '#0d9488', '&:hover': { bgcolor: '#0f766e' } }}
                                                        >
                                                            Upload Receipt
                                                        </Button>
                                                    )
                                                )}

                                                {invoice.status === 'Paid' && (
                                                    <Chip
                                                        icon={<CheckCircle2 size={14} />}
                                                        label="Paid"
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
                    <Typography variant="h6" fontWeight={800}>Submit Payment Proof</Typography>
                    <IconButton onClick={() => setUploadDialogOpen(false)}><X size={20} /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Please upload a photo of your bank receipt or mobile money confirmation.
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
                                    Click to browse or take photo
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
                                <span className="text-slate-500">Invoice ID:</span>
                                <span className="font-bold">#{selectedInvoice.id?.slice(-8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Total Amount:</span>
                                <span className="font-bold text-teal-600">ETB {parseFloat(selectedInvoice.amount).toLocaleString()}</span>
                            </div>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setUploadDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                    <Button 
                        onClick={handleUploadProof} 
                        variant="contained" 
                        disabled={!proofFile || uploading}
                        sx={{ borderRadius: 2, px: 4, bgcolor: '#0d9488', fontWeight: 700 }}
                    >
                        {uploading ? <CircularProgress size={20} color="inherit" /> : 'Submit Proof'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BillingPage;
