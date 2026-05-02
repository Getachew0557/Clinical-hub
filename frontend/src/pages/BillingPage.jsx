import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Typography, Card, CardContent, Grid,
    Box, Chip, CircularProgress, Alert, Divider, Button
} from '@mui/material';
import { Receipt, CreditCard, ChevronRight, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import axios from '../api/axiosInstance.js';

const API_URL = import.meta.env.VITE_API_BILLING_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const BillingPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(null); // invoiceId being processed

    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        fetchInvoices();
    }, [user]);

    const fetchInvoices = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            setError(null);
            // Fetch invoices scoped to this patient
            const res = await axios.get(`${API_URL}/invoices/${user.id}`, {
                headers: getAuthHeader()
            });
            setInvoices(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Billing fetch error:', err);
            setError('Failed to load invoices. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (invoiceId, amount) => {
        try {
            setProcessing(invoiceId);
            await axios.post(`${API_URL}/pay`, {
                invoiceId,
                amount,
                method: 'Simulated'
            }, { headers: getAuthHeader() });
            // Optimistic update
            setInvoices(prev =>
                prev.map(inv => inv.id === invoiceId ? { ...inv, status: 'Paid' } : inv)
            );
        } catch (err) {
            alert('Payment failed. Please try again.');
            console.error(err);
        } finally {
            setProcessing(null);
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
                    <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ borderRadius: 3 }}>
                        {error}
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
                                                    <Button
                                                        variant="contained"
                                                        startIcon={processing === invoice.id ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CreditCard size={16} />}
                                                        onClick={() => handlePayment(invoice.id, invoice.amount)}
                                                        disabled={processing === invoice.id}
                                                        sx={{ borderRadius: 3, px: 3 }}
                                                    >
                                                        {processing === invoice.id ? 'Processing...' : 'Pay Now'}
                                                    </Button>
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
        </Box>
    );
};

export default BillingPage;
