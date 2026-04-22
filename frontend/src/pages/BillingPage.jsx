import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
    Typography, Button, Card, CardContent, Grid, 
    Box, Chip, CircularProgress, Alert, Divider
} from '@mui/material';
import { Receipt, CreditCard, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import billingService from '../services/billingService';

const BillingPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { user } = useSelector((state) => state.auth);
    const patientId = user?.id;

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const data = await billingService.getInvoices(patientId);
            setInvoices(data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load invoices. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (invoiceId, amount) => {
        try {
            setProcessing(true);
            await billingService.payInvoice(invoiceId, amount, 'Simulated Credit Card');
            alert('Payment Successful!');
            fetchInvoices(); // Refresh list
        } catch (err) {
            alert('Payment failed. Please try again.');
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

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
            {/* ── Header ── */}
            <Box>
                <Typography variant="h5" fontWeight={900} color="text.primary">
                    Medical Billing & Invoices
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                    Manage your clinical fees, payments, and insurance claims
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ borderRadius: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={4}>
                {invoices.length === 0 ? (
                    <Grid item xs={12}>
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5, bgcolor: '#f8fafc' }}>
                            <CardContent className="flex flex-col items-center justify-center p-12 text-slate-400">
                                <Receipt size={48} className="mb-4 opacity-20" />
                                <Typography variant="body1">No billing records found.</Typography>
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
                                    borderRadius: 5,
                                    transition: 'all 0.2s',
                                    '&:hover': { border: '1px solid #94a3b8' }
                                }}
                            >
                                <CardContent className="p-6">
                                    <Box className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <Box className="flex items-center gap-4">
                                            <Box className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
                                                <Receipt size={24} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                                                    {invoice.description || 'Dental Consultation Service'}
                                                </Typography>
                                                <Box className="flex items-center gap-3 mt-1">
                                                    <Box className="flex items-center gap-1 text-slate-400">
                                                        <Clock size={14} />
                                                        <Typography variant="overline" sx={{ fontWeight: 800 }}>
                                                            {new Date(invoice.createdAt).toLocaleDateString()}
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
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Box className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                            <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800 }}>
                                                ${invoice.amount.toLocaleString()}
                                            </Typography>
                                            
                                            {invoice.status !== 'Paid' && (
                                                <Button
                                                    variant="contained"
                                                    startIcon={<CreditCard size={18} />}
                                                    onClick={() => handlePayment(invoice.id, invoice.amount)}
                                                    disabled={processing}
                                                    sx={{ borderRadius: 3, px: 4 }}
                                                >
                                                    {processing ? 'Processing...' : 'Pay Now'}
                                                </Button>
                                            )}
                                            
                                            <Button 
                                                variant="outlined" 
                                                color="secondary"
                                                endIcon={<ChevronRight size={18} />}
                                                sx={{ borderRadius: 3, borderColor: '#e2e8f0', color: '#64748b' }}
                                            >
                                                Details
                                            </Button>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>
        </Box>
    </Box>
    );
};

export default BillingPage;
