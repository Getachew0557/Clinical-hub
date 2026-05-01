import React, { useState, useEffect } from 'react';
import {
    Typography, Card, CardContent, Box, Button, Chip,
    CircularProgress, Alert, TextField, InputAdornment,
    Tabs, Tab, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, TablePagination, Grid
} from '@mui/material';
import { Receipt, Search, Download, CreditCard, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';

// Use billing API directly
const API_BASE = import.meta.env.VITE_API_BILLING_URL;
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const STATUS_COLORS = {
    Paid:      { bg: '#f0fdf4', text: '#15803d', chip: 'success' },
    Pending:   { bg: '#fffbeb', text: '#d97706', chip: 'warning' },
    Cancelled: { bg: '#fef2f2', text: '#dc2626', chip: 'error' },
};

export default function AdminBillingPage() {
    const { user } = useSelector(s => s.auth);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState('All');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => { fetchInvoices(); }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/invoices`, { headers: getAuthHeader() });
            const data = await res.json();
            setInvoices(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            setError('Failed to load invoices.');
        } finally {
            setLoading(false);
        }
    };

    const totals = {
        All:       invoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0),
        Paid:      invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0),
        Pending:   invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + parseFloat(i.amount || 0), 0),
        Cancelled: invoices.filter(i => i.status === 'Cancelled').reduce((s, i) => s + parseFloat(i.amount || 0), 0),
    };

    const filtered = invoices.filter(inv => {
        const matchTab = tab === 'All' || inv.status === tab;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            inv.id?.toLowerCase().includes(q) ||
            inv.description?.toLowerCase().includes(q) ||
            inv.patientId?.toLowerCase().includes(q);
        return matchTab && matchSearch;
    });

    const exportCSV = () => {
        const headers = ['Invoice ID', 'Patient ID', 'Doctor ID', 'Amount (ETB)', 'Status', 'Description', 'Due Date', 'Created'];
        const rows = filtered.map(inv => [
            inv.id, inv.patientId, inv.doctorId,
            inv.amount, inv.status, inv.description || '',
            inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '',
            new Date(inv.createdAt).toLocaleDateString()
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `billing_${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const TABS = ['All', 'Paid', 'Pending', 'Cancelled'];

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
            <div className="flex flex-col gap-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Typography variant="h5" fontWeight={700} color="text.primary">Billing Oversight</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            All invoices across the clinic — paid, pending, cancelled
                        </Typography>
                    </div>
                    <Button variant="outlined" startIcon={<Download size={16} />} onClick={exportCSV} sx={{ borderRadius: 3 }}>
                        Export CSV
                    </Button>
                </div>

                {/* Revenue Tiles */}
                <Grid container spacing={3}>
                    {[
                        { label: 'Total Revenue', value: totals.All, icon: TrendingUp, color: '#0d9488', bg: '#ccfbf1' },
                        { label: 'Collected (Paid)', value: totals.Paid, icon: CreditCard, color: '#059669', bg: '#f0fdf4' },
                        { label: 'Outstanding', value: totals.Pending, icon: Clock, color: '#d97706', bg: '#fffbeb' },
                        { label: 'Cancelled', value: totals.Cancelled, icon: AlertCircle, color: '#dc2626', bg: '#fef2f2' },
                    ].map(tile => (
                        <Grid item xs={12} sm={6} md={3} key={tile.label}>
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {tile.label}
                                        </Typography>
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: tile.bg }}>
                                            <tile.icon size={18} style={{ color: tile.color }} />
                                        </div>
                                    </div>
                                    <Typography variant="h5" fontWeight={800} color="text.primary">
                                        ETB {tile.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {invoices.filter(i => tile.label === 'Total Revenue' || i.status === tile.label.split(' ')[0]).length} invoices
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

                {/* Tabs + Search */}
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                    <CardContent sx={{ p: 0 }}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 pt-3 pb-0 border-b border-slate-100">
                            <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }}
                                sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 80 } }}>
                                {TABS.map(t => (
                                    <Tab key={t} value={t} label={
                                        <span className="flex items-center gap-1.5">
                                            {t}
                                            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                                                {t === 'All' ? invoices.length : invoices.filter(i => i.status === t).length}
                                            </span>
                                        </span>
                                    } />
                                ))}
                            </Tabs>
                            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-100 mb-2 md:mb-0 mx-4 md:mx-0 md:mr-4">
                                <Search size={16} className="text-slate-400" />
                                <input
                                    placeholder="Search invoice, patient ID..."
                                    className="bg-transparent text-sm outline-none w-48"
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(0); }}
                                />
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
                                                {['Invoice ID', 'Patient ID', 'Description', 'Amount (ETB)', 'Due Date', 'Status', 'Created'].map(h => (
                                                    <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', py: 1.5, px: 2 }}>
                                                        {h}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(inv => (
                                                <TableRow key={inv.id} hover>
                                                    <TableCell sx={{ px: 2, py: 1.5 }}>
                                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0d9488' }}>
                                                            #{inv.id?.slice(-8).toUpperCase()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ px: 2 }}>
                                                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                                            #{inv.patientId?.slice(-6).toUpperCase()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ px: 2 }}>
                                                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {inv.description || 'Consultation'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ px: 2 }}>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            ETB {parseFloat(inv.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ px: 2 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ px: 2 }}>
                                                        <Chip
                                                            label={inv.status}
                                                            size="small"
                                                            color={STATUS_COLORS[inv.status]?.chip || 'default'}
                                                            variant="outlined"
                                                            sx={{ fontWeight: 700, borderRadius: 2 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ px: 2 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filtered.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                                                        <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                                                        <Typography variant="body2">No invoices found.</Typography>
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
        </Box>
    );
}
