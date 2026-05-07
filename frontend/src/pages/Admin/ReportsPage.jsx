import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    Typography, Button, Card, CardContent, Grid, Box,
    CircularProgress, Alert, Menu, MenuItem, Divider, Chip,
    Tabs, Tab, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper,
    TablePagination, InputBase
} from '@mui/material';
import {
    Search, Calendar, Package, Users, Download, FileText, Image as ImageIcon,
    RefreshCcw, TrendingUp, AlertCircle, Save, Filter, Activity, UserCheck, Stethoscope
} from 'lucide-react';
import reportService from '../../api/report.service';
import { exportAsImage, exportAsPDF } from '../../utils/exportUtils';

const COLORS = ['#3f51b5', '#009688', '#ff9800', '#f44336', '#9c27b0', '#795548'];

export default function ReportsPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const [stats, setStats] = useState({
        appointments: { total: 0, monthlyTrend: [], byStatus: {} },
        inventory: { totalItems: 0, lowStockItems: 0, categories: {} },
        demographics: { totalPatients: 0, ageGroups: {}, genderDist: {} }
    });

    const [detailedData, setDetailedData] = useState({
        patients: [],
        medications: [],
        billings: [],
        appointments: [],
        doctors: []
    });

    const [doctorPerformance, setDoctorPerformance] = useState([]);

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [exportAnchorEl, setExportAnchorEl] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const [aptData, invData, demoData, patients, meds, bills, detailedApts, doctorsPerf, doctorReg] = await Promise.all([
                reportService.getAppointmentStats(),
                reportService.getInventorySummary(),
                reportService.getPatientDemographics(),
                reportService.getDetailedPatients(),
                reportService.getDetailedInventory(),
                reportService.getDetailedBillings(),
                reportService.getDetailedAppointments(),
                reportService.getDoctorPerformance(),
                reportService.getDetailedDoctors(),
                reportService.getFinanceSummary().catch(() => null),
            ]);

            setStats({
                appointments: aptData || { total: 0, monthlyTrend: [], byStatus: {} },
                inventory: invData || { totalItems: 0, lowStockItems: 0, categories: {} },
                demographics: demoData || { totalPatients: 0, ageGroups: {}, genderDist: {} }
            });

            setDetailedData({
                patients: patients || [],
                medications: meds || [],
                billings: bills || [],
                appointments: detailedApts || [],
                doctors: doctorReg || []
            });
            setDoctorPerformance(doctorsPerf || []);
            setError(null);
        } catch (err) {
            console.error('Fetch Reports Error:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveReport = async () => {
        try {
            setSaving(true);
            await reportService.saveReport({
                title: `Clinic Status Report - ${new Date().toLocaleDateString()}`,
                type: 'Detailed',
                data: { stats, detailedData }
            });
            alert(t('common.success'));
        } catch (err) {
            console.error('Save error:', err);
            alert(t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    // Data Transformations
    const ageData = useMemo(() =>
        Object.entries(stats.demographics.ageGroups || {}).map(([name, value]) => ({ name, value })),
        [stats.demographics]);

    const statusData = useMemo(() =>
        Object.entries(stats.appointments.byStatus || {}).map(([name, value]) => ({ name, value })),
        [stats.appointments]);

    const inventoryData = useMemo(() =>
        Object.entries(stats.inventory.categories || {}).map(([name, value]) => ({ name, value })),
        [stats.inventory]);

    // Simulated Financial Data
    const financialData = [
        { month: 'Jan', revenue: 4500, expenses: 3200 },
        { month: 'Feb', revenue: 5200, expenses: 3100 },
        { month: 'Mar', revenue: 4800, expenses: 3400 },
        { month: 'Apr', revenue: 6100, expenses: 3800 },
        { month: 'May', revenue: 5900, expenses: 3600 },
        { month: 'Jun', revenue: 7200, expenses: 4100 },
    ];
    const doctorChartData = useMemo(() =>
        doctorPerformance.map(d => ({ name: d.name, patients: d.patients, surgery: d.surgery })),
        [doctorPerformance]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setPage(0); 
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await reportService.updateAppointmentStatus(id, newStatus);
            setDetailedData(prev => ({
                ...prev,
                appointments: prev.appointments.map(a => a.id === id ? { ...a, status: newStatus } : a)
            }));
        } catch (err) {
            console.error('Update status error:', err);
            alert(t('common.error'));
        }
    };

    const safeSearch = searchTerm.toLowerCase();

    const filteredPatients = detailedData.patients.filter(p =>
        (p.name || p.fullName || '').toLowerCase().includes(safeSearch) ||
        String(p.id || '').toLowerCase().includes(safeSearch) ||
        (p.phone || '').includes(searchTerm)
    );

    const filteredMedications = detailedData.medications.filter(m =>
        (m.name || '').toLowerCase().includes(safeSearch) ||
        (m.category || '').toLowerCase().includes(safeSearch)
    );

    const filteredBillings = detailedData.billings.filter(b =>
        (b.patient || '').toLowerCase().includes(safeSearch) ||
        (b.status || '').toLowerCase().includes(safeSearch)
    );

    const filteredAppointments = detailedData.appointments.filter(a =>
        (a.patientName || '').toLowerCase().includes(safeSearch) ||
        (a.doctorName || '').toLowerCase().includes(safeSearch) ||
        (a.status || '').toLowerCase().includes(safeSearch) ||
        String(a.id || '').toLowerCase().includes(safeSearch)
    );

    const filteredDoctors = detailedData.doctors.filter(d =>
        (d.name || d.fullName || '').toLowerCase().includes(safeSearch) ||
        (d.specialty || '').toLowerCase().includes(safeSearch) ||
        (d.department || '').toLowerCase().includes(safeSearch) ||
        String(d.id || '').toLowerCase().includes(safeSearch)
    );

    const handleExportClick = (event) => setExportAnchorEl(event.currentTarget);
    const handleExportClose = () => setExportAnchorEl(null);

    if (loading) {
        return (
            <Box className="flex h-screen items-center justify-center">
                <CircularProgress thickness={5} />
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 2, lg: 4 }, minWidth: 0, pb: 8 }}>
            <Box className="flex flex-col gap-6">
            {/* Header */}
            <Box className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Box>
                    <Typography variant="h5" fontWeight={900} color="text.primary">{t('report.adminInsights')}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {t('report.adminInsightsDesc')}
                    </Typography>
                </Box>
                <Box className="flex gap-2">
                    <Button
                        variant="outlined"
                        startIcon={<Save size={18} />}
                        onClick={handleSaveReport}
                        disabled={saving}
                        sx={{ borderRadius: 3, fontWeight: 700 }}
                    >
                        {saving ? t('common.saving') : t('report.archiveReport')}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Download size={18} />}
                        onClick={handleExportClick}
                        sx={{ borderRadius: 3, bgcolor: '#0d9488', fontWeight: 800 }}
                    >
                        {t('report.exportData')}
                    </Button>
                    <Menu
                        anchorEl={exportAnchorEl}
                        open={Boolean(exportAnchorEl)}
                        onClose={handleExportClose}
                        PaperProps={{ sx: { borderRadius: 4, mt: 1, minWidth: 220, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' } }}
                    >
                        <MenuItem onClick={() => { exportAsPDF('full-clinical-report', 'Clinical_Report_A4'); handleExportClose(); }} sx={{ gap: 1.5, py: 1.5 }}>
                            <FileText size={16} className="text-red-500" />
                            <Box>
                                <Typography variant="body2" fontWeight={800}>Full PDF Report</Typography>
                                <Typography variant="caption" color="text.secondary">Optimized for distribution</Typography>
                            </Box>
                        </MenuItem>
                        <MenuItem onClick={() => { exportAsImage('full-clinical-report', 'Clinical_Report_Full', 'png'); handleExportClose(); }} sx={{ gap: 1.5, py: 1.5 }}>
                            <ImageIcon size={16} className="text-blue-500" />
                            <Box>
                                <Typography variant="body2" fontWeight={800}>High-Res Image</Typography>
                                <Typography variant="caption" color="text.secondary">PNG format @ 2x scale</Typography>
                            </Box>
                        </MenuItem>
                        <MenuItem onClick={() => {
                            const tabData = [
                                detailedData.patients,
                                detailedData.medications,
                                detailedData.billings,
                                detailedData.appointments,
                                detailedData.doctors
                            ][activeTab - 1] || [];
                            if (tabData.length === 0) { alert('Switch to a data tab first'); handleExportClose(); return; }
                            const headers = Object.keys(tabData[0] || {});
                            const rows = tabData.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
                            const csv = [headers.join(','), ...rows].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a'); a.href = url;
                            a.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
                            a.click(); URL.revokeObjectURL(url);
                            handleExportClose();
                        }} sx={{ gap: 1.5, py: 1.5 }}>
                            <Download size={16} className="text-green-600" />
                            <Box>
                                <Typography variant="body2" fontWeight={800}>Export CSV</Typography>
                                <Typography variant="caption" color="text.secondary">Current tab data</Typography>
                            </Box>
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ borderRadius: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Navigation Tabs & Search */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ '& .MuiTab-root': { fontWeight: 800, px: 3, fontSize: '0.8125rem' } }}>
                    <Tab label={t('report.tab.dashboard')} />
                    <Tab label={t('report.tab.patients')} />
                    <Tab label={t('report.tab.medications')} />
                    <Tab label={t('report.tab.financials')} />
                    <Tab label={t('report.tab.clinical')} />
                    <Tab label={t('report.tab.doctors')} />
                </Tabs>

                {activeTab !== 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc', px: 2, py: 0.75, borderRadius: 2.5, border: '1px solid #e2e8f0', minWidth: 280 }}>
                        <Search size={18} className="text-slate-400" />
                        <InputBase 
                            placeholder={t('report.searchRecords')}
                            sx={{ ml: 1, flex: 1, fontSize: '0.875rem', fontWeight: 500 }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </Box>
                )}
            </Box>

            {/* Exportable Report Container */}
            <Box id="full-clinical-report" sx={{ bgcolor: 'white', borderRadius: 4, p: { xs: 2, md: 5 }, border: '1px solid #e2e8f0' }}>
                <Box className="mb-10 flex justify-between items-end border-b pb-8 border-slate-100">
                    <Box>
                        <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: '-0.02em', color: '#0f172a' }}>
                            {t('report.performanceDashboard')}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.8, fontWeight: 600 }}>
                            {t('report.reference')}: {new Date().getFullYear()}-{Math.random().toString(36).substr(2, 6).toUpperCase()} • {t('report.generatedOn')} {new Date().toLocaleString()}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Chip label={t('report.confidential')} color="error" variant="filled" size="small" sx={{ fontWeight: 900, borderRadius: 1.5, px: 1 }} />
                    </Box>
                </Box>

                {/* KPI Section */}
                <Grid container spacing={3} sx={{ mb: 8 }}>
                    {[
                        { label: t('report.kpi.totalVisits'), value: stats.appointments.total, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: <Users size={24} /> },
                        { label: t('report.kpi.patientCount'), value: stats.demographics.totalPatients, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', icon: <UserCheck size={24} /> },
                        { label: t('report.kpi.inventory'), value: stats.inventory.totalItems, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: <Package size={24} /> },
                        { label: t('report.kpi.lowStock'), value: stats.inventory.lowStockItems, color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: <AlertCircle size={24} /> }
                    ].map((kpi, idx) => (
                        <Grid item xs={12} sm={6} md={3} key={idx}>
                            <Box sx={{ 
                                p: 4, 
                                borderRadius: 5, 
                                bgcolor: '#ffffff', 
                                border: '1px solid #e2e8f0', 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', borderColor: kpi.color }
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                    <Box sx={{ 
                                        width: 48, height: 48, 
                                        borderRadius: 3, 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        bgcolor: kpi.bg, color: kpi.color, border: `1px solid ${kpi.border}` 
                                    }}>
                                        {kpi.icon}
                                    </Box>
                                    <Activity size={18} color="#cbd5e1" />
                                </Box>
                                <Box>
                                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                                        {kpi.value.toLocaleString()}
                                    </Typography>
                                    <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', mt: 0.5, display: 'block' }}>
                                        {kpi.label}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Main Content Switcher */}
                {activeTab === 0 ? (
                    <Grid container spacing={5}>
                        <Grid item xs={12} lg={8}>
                            <Box sx={{ mb: 6 }}>
                                <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5, color: '#0f172a' }}>
                                    <TrendingUp size={22} className="text-blue-600" />
                                    {t('report.financialTrajectory')}
                                </Typography>
                                <Box sx={{ height: 400, p: 3, borderRadius: 5, bgcolor: '#ffffff', border: '1px solid #f1f5f9' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={financialData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dx={-10} />
                                            <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', padding: '12px 16px' }} />
                                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 20 }} iconType="circle" />
                                            <Line type="monotone" dataKey="revenue" name={t('report.revenueTotal')} stroke="#0d9488" strokeWidth={4} dot={{ r: 5, fill: '#0d9488', strokeWidth: 3, stroke: '#ffffff' }} />
                                            <Line type="monotone" dataKey="expenses" name={t('report.operationalCost')} stroke="#cbd5e1" strokeWidth={3} strokeDasharray="6 6" dot={{ r: 4, fill: '#cbd5e1', strokeWidth: 2, stroke: '#ffffff' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 6, borderStyle: 'dashed' }} />

                            <Box>
                                <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5, color: '#0f172a' }}>
                                    <Calendar size={22} className="text-indigo-600" />
                                    {t('report.attendancePatterns')}
                                </Typography>
                                <Box sx={{ height: 320, p: 3, borderRadius: 5, bgcolor: '#ffffff', border: '1px solid #f1f5f9' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.appointments.monthlyTrend?.length > 1 ? stats.appointments.monthlyTrend : [...(stats.appointments.monthlyTrend || []), { month: 'Present', count: 0 }]} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gradVisits" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dx={-10} />
                                            <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }} />
                                            <Area type="monotone" dataKey="count" name={t('report.patientVolume')} stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#gradVisits)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} lg={4}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {/* Distribution Charts */}
                                <Box sx={{ p: 4, borderRadius: 5, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
                                    <Typography variant="subtitle2" fontWeight={800} className="uppercase" sx={{ mb: 3, color: '#64748b', letterSpacing: '0.1em' }}>{t('report.demographicDist')}</Typography>
                                    <Box sx={{ height: 260 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={ageData.length ? ageData : [{name: 'No Data', value: 1}]} innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                                                    {(ageData.length ? ageData : [{name: 'No Data', value: 1}]).map((_, i) => <Cell key={i} fill={ageData.length ? COLORS[i % COLORS.length] : '#f1f5f9'} />)}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                    <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        {ageData.map((item, i) => (
                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                                                <Typography variant="caption" fontWeight={700} color="#334155">{item.name}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>

                                <Box sx={{ p: 4, borderRadius: 5, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
                                    <Typography variant="subtitle2" fontWeight={800} className="uppercase" sx={{ mb: 3, color: '#64748b', letterSpacing: '0.1em' }}>{t('report.successRate')}</Typography>
                                    <Box sx={{ height: 220 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={statusData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={90} tick={{ fontSize: 12, fontWeight: 800, fill: '#475569' }} />
                                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                                <Bar dataKey="value" name="Occurrences" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Box>

                                <Box sx={{ p: 4, borderRadius: 5, bgcolor: '#f0fdfa', border: '1px solid #ccfbf1' }}>
                                    <Typography variant="subtitle2" fontWeight={800} className="uppercase" sx={{ mb: 3, letterSpacing: '0.1em', color: '#0f766e' }}>{t('report.supplyChain')}</Typography>
                                    <Box sx={{ height: 180 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={inventoryData} margin={{ top: 10 }}>
                                                <XAxis dataKey="name" hide />
                                                <Tooltip />
                                                <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                ) : (
                    <Box sx={{ minHeight: 600 }}>
                        {activeTab === 1 && (
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Patient ID</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('common.fullName')}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Age/Gender</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('common.phone')}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Registration</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('common.status')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredPatients
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row) => (
                                                <TableRow key={row.id} hover>
                                                    <TableCell><Typography variant="body2" fontWeight={700}>{row.id}</Typography></TableCell>
                                                    <TableCell><Typography variant="body2" fontWeight={600}>{row.name}</Typography></TableCell>
                                                    <TableCell>{row.age} / {row.gender}</TableCell>
                                                    <TableCell>{row.phone}</TableCell>
                                                    <TableCell>{row.regDate}</TableCell>
                                                    <TableCell>
                                                        <Chip label={row.status} size="small" variant="outlined" color={row.status === 'Active' ? 'success' : 'default'} sx={{ fontWeight: 800, borderRadius: 2 }} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50]}
                                    component="div"
                                    count={filteredPatients.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </TableContainer>
                        )}

                        {activeTab === 2 && (
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Item ID</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('inventory.itemName')}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Category</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('inventory.quantity')}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Expiry Date</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Stock Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredMedications
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row) => (
                                                <TableRow key={row.id} hover>
                                                    <TableCell><Typography variant="body2" fontWeight={700}>{row.id}</Typography></TableCell>
                                                    <TableCell><Typography variant="body2" fontWeight={600}>{row.name}</Typography></TableCell>
                                                    <TableCell>{row.category}</TableCell>
                                                    <TableCell>{row.quantity} {row.unit}</TableCell>
                                                    <TableCell>{row.expiry}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={row.status}
                                                            size="small"
                                                            sx={{ 
                                                                fontWeight: 800, 
                                                                borderRadius: 2,
                                                                bgcolor: row.status === 'In Stock' ? '#f0fdf4' : row.status === 'Low Stock' ? '#fffbeb' : '#fef2f2',
                                                                color: row.status === 'In Stock' ? '#15803d' : row.status === 'Low Stock' ? '#d97706' : '#dc2626'
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50]}
                                    component="div"
                                    count={filteredMedications.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </TableContainer>
                        )}

                        {activeTab === 3 && (
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Invoice ID</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('common.fullName')}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('appt.date')}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('billing.amount')}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Method</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('billing.status')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredBillings
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row) => (
                                                <TableRow key={row.id} hover>
                                                    <TableCell><Typography variant="body2" fontWeight={700}>{row.id}</Typography></TableCell>
                                                    <TableCell><Typography variant="body2" fontWeight={600}>{row.patient}</Typography></TableCell>
                                                    <TableCell>{row.date}</TableCell>
                                                    <TableCell><Typography variant="body2" fontWeight={800}>${row.amount.toLocaleString()}</Typography></TableCell>
                                                    <TableCell>{row.method}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={row.status}
                                                            size="small"
                                                            sx={{ 
                                                                fontWeight: 800, 
                                                                borderRadius: 2,
                                                                bgcolor: row.status === 'Paid' ? '#f0fdf4' : row.status === 'Pending' ? '#fffbeb' : '#fef2f2',
                                                                color: row.status === 'Paid' ? '#15803d' : row.status === 'Pending' ? '#d97706' : '#dc2626'
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50]}
                                    component="div"
                                    count={filteredBillings.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </TableContainer>
                        )}

                        {activeTab === 4 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {/* Doctor Performance Chart */}
                                <Box sx={{ p: 4, bgcolor: '#f8fafc', borderRadius: 5, border: '1px solid #e2e8f0' }}>
                                    <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Stethoscope size={20} className="text-teal-600" />
                                        {t('report.performanceMatrix')}
                                    </Typography>
                                    <Box sx={{ height: 320 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={doctorChartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="patients" name="Patients Treated" fill="#0d9488" radius={[6, 6, 0, 0]} />
                                                <Bar dataKey="surgery" name="Procedures Done" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Box>

                                {/* Appointment Management Table */}
                                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                    <Table>
                                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Ref ID</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('report.clinicalCase')}</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('report.assignedPhysician')}</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>DateTime</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('report.emrStatus')}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('report.operation')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredAppointments
                                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                .map((row) => (
                                                    <TableRow key={row.id} hover>
                                                        <TableCell><Typography variant="body2" fontWeight={700}>{row.id}</Typography></TableCell>
                                                        <TableCell><Typography variant="body2" fontWeight={600}>{row.patientName}</Typography></TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <UserCheck size={14} className="text-teal-600" />
                                                                <Typography variant="body2" fontWeight={600}>{row.doctorName}</Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={600}>{row.date}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{row.time}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={row.emrStatus}
                                                                size="small"
                                                                sx={{ fontWeight: 800, borderRadius: 2, bgcolor: row.emrStatus === 'Finalized' ? '#f0fdf4' : '#fffbeb', color: row.emrStatus === 'Finalized' ? '#15803d' : '#d97706' }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <TextField
                                                                select
                                                                size="small"
                                                                value={row.status}
                                                                onChange={(e) => handleUpdateStatus(row.id, e.target.value)}
                                                                SelectProps={{ native: true }}
                                                                sx={{ '& .MuiInputBase-root': { borderRadius: 2, fontWeight: 800, fontSize: '0.75rem' }, width: 120 }}
                                                            >
                                                                <option value="Pending">Pending</option>
                                                                <option value="Confirmed">Confirmed</option>
                                                                <option value="Completed">Completed</option>
                                                                <option value="Cancelled">Cancelled</option>
                                                            </TextField>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50]}
                                    component="div"
                                    count={filteredAppointments.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </Box>
                        )}

                        {activeTab === 5 && (
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('report.physicianId')}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('sidebar.doctors')}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('report.specialty')}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('report.department')}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('report.totalSurgeries')}</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('common.status')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredDoctors
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row) => (
                                                <TableRow key={row.id} hover>
                                                    <TableCell><Typography variant="body2" fontWeight={700}>{row.id}</Typography></TableCell>
                                                    <TableCell><Typography variant="body2" fontWeight={600}>{row.name}</Typography></TableCell>
                                                    <TableCell>{row.specialty}</TableCell>
                                                    <TableCell>{row.department}</TableCell>
                                                    <TableCell><Typography variant="body2" fontWeight={800}>{row.surgeries}</Typography></TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={row.status}
                                                            size="small"
                                                            sx={{ fontWeight: 800, borderRadius: 2, bgcolor: row.status === 'On Duty' ? '#f0fdf4' : '#fffbeb', color: row.status === 'On Duty' ? '#15803d' : '#d97706' }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50]}
                                    component="div"
                                    count={filteredDoctors.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </TableContainer>
                        )}

                        {((activeTab === 1 && filteredPatients.length === 0) ||
                            (activeTab === 2 && filteredMedications.length === 0) ||
                            (activeTab === 3 && filteredBillings.length === 0) ||
                            (activeTab === 4 && filteredAppointments.length === 0) ||
                            (activeTab === 5 && filteredDoctors.length === 0)) && (
                                <Box sx={{ p: 10, textAlign: 'center' }}>
                                    <Typography variant="body1" fontWeight={700} color="text.secondary">
                                        {t('report.noMatching', { term: searchTerm })}
                                    </Typography>
                                </Box>
                            )}
                    </Box>
                )}

                {/* Report Footer */}
                <Box sx={{ mt: 10, pt: 6, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', maxWidth: 700, mx: 'auto', fontWeight: 500 }}>
                        {t('report.footer')}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#94a3b8', fontWeight: 700 }}>
                        &copy; {new Date().getFullYear()} {t('report.copyright')}
                    </Typography>
                </Box>
            </Box>
            </Box>
        </Box>
    );
}

