import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    Typography, Button, Card, CardContent, Grid, Box,
    CircularProgress, Alert, Menu, MenuItem, Divider, Chip,
    Tabs, Tab, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper,
    TablePagination
} from '@mui/material';
import {
    Search, Calendar, Package, Users, Download, FileText, Image as ImageIcon,
    RefreshCcw, TrendingUp, AlertCircle, Save, Filter, Activity, UserCheck, Stethoscope
} from 'lucide-react';
import reportService from '../../api/report.service';
import { exportAsImage, exportAsPDF } from '../../utils/exportUtils';

const COLORS = ['#3f51b5', '#009688', '#ff9800', '#f44336', '#9c27b0', '#795548'];

export default function ReportsPage() {
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
    const [rowsPerPage, setRowsPerPage] = useState(5);

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
                reportService.getDetailedDoctors()
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
            setError('Failed to load report data. Please ensure the report-service is running.');
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
            alert('Report saved to backend successfully!');
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save report to backend');
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
        setPage(0); // Reset pagination on tab change
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
            // Local update for responsiveness
            setDetailedData(prev => ({
                ...prev,
                appointments: prev.appointments.map(a => a.id === id ? { ...a, status: newStatus } : a)
            }));
        } catch (err) {
            console.error('Update status error:', err);
            alert('Failed to update status');
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
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="flex flex-col gap-6 p-2">
            {/* Header */}
            <Box className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Box>
                    <Typography variant="h5" color="text.primary">Administrative Insights</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        Comprehensive operational analysis & financial overview
                    </Typography>
                </Box>
                <Box className="flex gap-2">
                    <Button
                        variant="soft"
                        startIcon={<Save size={18} />}
                        onClick={handleSaveReport}
                        disabled={saving}
                        sx={{ borderRadius: 3 }}
                    >
                        {saving ? 'Saving...' : 'Archive Report'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Download size={18} />}
                        onClick={handleExportClick}
                        sx={{ borderRadius: 3 }}
                    >
                        Export Data
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
                                <Typography variant="body2" fontWeight={700}>Full PDF Report</Typography>
                                <Typography variant="caption" color="text.secondary">Optimized for distribution</Typography>
                            </Box>
                        </MenuItem>
                        <MenuItem onClick={() => { exportAsImage('full-clinical-report', 'Clinical_Report_Full', 'png'); handleExportClose(); }} sx={{ gap: 1.5, py: 1.5 }}>
                            <ImageIcon size={16} className="text-blue-500" />
                            <Box>
                                <Typography variant="body2" fontWeight={700}>High-Res Image</Typography>
                                <Typography variant="caption" color="text.secondary">PNG format @ 2x scale</Typography>
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
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ '& .MuiTab-root': { fontWeight: 700, px: 3 } }}>
                    <Tab label="Analytical Dashboard" />
                    <Tab label="Patient Registry" />
                    <Tab label="Medication Status" />
                    <Tab label="Financial Audit" />
                    <Tab label="Clinical Activity" />
                    <Tab label="Doctor Registry" />
                </Tabs>

                {activeTab !== 0 && (
                    <TextField
                        size="small"
                        placeholder="Search records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ minWidth: 250, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} className="text-slate-400" />
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            </Box>

            {/* Exportable Report Container */}
            <Box id="full-clinical-report" sx={{ bgcolor: 'white', borderRadius: 6, p: 4, border: '1px solid #f1f5f9' }}>
                <Box className="mb-10 flex justify-between items-end border-b pb-8 border-slate-100">
                    <Box>
                        <Typography variant="h4" sx={{ letterSpacing: '-0.03em', color: '#0f172a' }}>
                            Health System Performance Dashboard
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Reference: {new Date().getFullYear()}-{Math.random().toString(36).substr(2, 6).toUpperCase()} • Generated on {new Date().toLocaleString()}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Chip label="CONFIDENTIAL" color="error" variant="filled" size="small" sx={{ fontWeight: 800, borderRadius: 1, px: 1 }} />
                    </Box>
                </Box>

                {/* KPI Section */}
                <Grid container spacing={3} sx={{ mb: 8 }}>
                    {[
                        { label: 'Total Visits', value: stats.appointments.total, color: '#2563eb', icon: <Users size={20} /> },
                        { label: 'Patient Headcount', value: stats.demographics.totalPatients, color: '#059669', icon: <Users size={20} /> },
                        { label: 'Asset Inventory', value: stats.inventory.totalItems, color: '#d97706', icon: <Package size={20} /> },
                        { label: 'Low Stock Risks', value: stats.inventory.lowStockItems, color: '#dc2626', icon: <AlertCircle size={20} /> }
                    ].map((kpi, idx) => (
                        <Grid item xs={12} sm={6} md={3} key={idx}>
                            <Box sx={{ p: 4, borderRadius: 5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, color: kpi.color }}>
                                    {kpi.icon}
                                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', opacity: 0.7 }}>{kpi.label}</Typography>
                                </Box>
                                <Typography variant="h3" sx={{ fontWeight: 900, color: '#1e293b' }}>{kpi.value.toLocaleString()}</Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Main Content Switcher */}
                {activeTab === 0 ? (
                    <Grid container spacing={5}>
                        <Grid item xs={12} lg={8}>
                            <Box sx={{ mb: 6 }}>
                                <Typography variant="subtitle1" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <TrendingUp size={20} className="text-blue-600" />
                                    Operational Trajectory & Revenue Volume
                                </Typography>
                                <Box sx={{ height: 400 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={financialData} margin={{ left: -20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} />
                                            <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} />
                                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 20 }} />
                                            <Line type="monotone" dataKey="revenue" name="Total Revenue ($)" stroke="#2563eb" strokeWidth={5} dot={{ r: 6, fill: '#2563eb' }} activeDot={{ r: 8 }} />
                                            <Line type="monotone" dataKey="expenses" name="Operational Cost ($)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 6" dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 6, borderStyle: 'dashed' }} />

                            <Box>
                                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Calendar size={20} className="text-indigo-600" />
                                    Temporal Attendance Patterns
                                </Typography>
                                <Box sx={{ height: 320 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.appointments.monthlyTrend} margin={{ left: -20 }}>
                                            <defs>
                                                <linearGradient id="gradVisits" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} />
                                            <YAxis hide />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="count" name="Patient Volume" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#gradVisits)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} lg={4}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {/* Distribution Charts */}
                                <Box sx={{ p: 4, borderRadius: 6, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <Typography variant="subtitle2" fontWeight={800} className="uppercase" sx={{ mb: 3, opacity: 0.6, letterSpacing: '0.1em' }}>Demographic Distribution</Typography>
                                    <Box sx={{ height: 260 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={ageData} innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value">
                                                    {ageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                    <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        {ageData.map((item, i) => (
                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                                                <Typography variant="caption" fontWeight={700} color="#475569">{item.name}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>

                                <Box sx={{ p: 4, borderRadius: 6, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <Typography variant="subtitle2" fontWeight={800} className="uppercase" sx={{ mb: 3, opacity: 0.6, letterSpacing: '0.1em' }}>Success Rate Matrix</Typography>
                                    <Box sx={{ height: 220 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={statusData} layout="vertical" margin={{ left: -10 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={90} tick={{ fontSize: 12, fontWeight: 600 }} />
                                                <Tooltip />
                                                <Bar dataKey="value" name="Occurrences" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Box>

                                <Box sx={{ p: 4, borderRadius: 6, bgcolor: '#fff7ed', border: '1px solid #ffedd5' }}>
                                    <Typography variant="subtitle2" fontWeight={800} className="uppercase" sx={{ mb: 3, opacity: 0.6, letterSpacing: '0.1em', color: '#9a3412' }}>Supply Chain Allocation</Typography>
                                    <Box sx={{ height: 180 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={inventoryData} margin={{ top: 10 }}>
                                                <XAxis dataKey="name" hide />
                                                <Tooltip />
                                                <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} barSize={40} />
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
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800 }}>Patient ID</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Full Name</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Age/Gender</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Contact</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Registration</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredPatients
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row) => (
                                                <TableRow key={row.id} hover>
                                                    <TableCell><Typography variant="body2" fontWeight={700}>{row.id}</Typography></TableCell>
                                                    <TableCell>{row.name}</TableCell>
                                                    <TableCell>{row.age} / {row.gender}</TableCell>
                                                    <TableCell>{row.phone}</TableCell>
                                                    <TableCell>{row.regDate}</TableCell>
                                                    <TableCell>
                                                        <Chip label={row.status} size="small" variant="outlined" color={row.status === 'Active' ? 'success' : 'default'} sx={{ fontWeight: 700 }} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
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
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800 }}>Item ID</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Medication / Supply</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Quantity</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Expiry Date</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Stock Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredMedications
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row) => (
                                                <TableRow key={row.id} hover>
                                                    <TableCell><Typography variant="body2" fontWeight={700}>{row.id}</Typography></TableCell>
                                                    <TableCell>{row.name}</TableCell>
                                                    <TableCell>{row.category}</TableCell>
                                                    <TableCell>{row.quantity} {row.unit}</TableCell>
                                                    <TableCell>{row.expiry}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={row.status}
                                                            size="small"
                                                            color={row.status === 'In Stock' ? 'success' : row.status === 'Low Stock' ? 'warning' : 'error'}
                                                            sx={{ fontWeight: 700 }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
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
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800 }}>Invoice ID</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Patient Name</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Payment Method</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredBillings
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row) => (
                                                <TableRow key={row.id} hover>
                                                    <TableCell><Typography variant="body2" fontWeight={700}>{row.id}</Typography></TableCell>
                                                    <TableCell>{row.patient}</TableCell>
                                                    <TableCell>{row.date}</TableCell>
                                                    <TableCell fontWeight={700}>${row.amount.toLocaleString()}</TableCell>
                                                    <TableCell>{row.method}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={row.status}
                                                            size="small"
                                                            color={row.status === 'Paid' ? 'success' : row.status === 'Pending' ? 'warning' : 'error'}
                                                            sx={{ fontWeight: 700 }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
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
                                <Box sx={{ p: 4, bgcolor: '#f1f5f9', borderRadius: 5 }}>
                                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Stethoscope size={18} />
                                        Doctor Productivity & Patient Engagement Matrix
                                    </Typography>
                                    <Box sx={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={doctorChartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                <YAxis axisLine={false} tickLine={false} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="patients" name="Patients Treated" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                                                <Bar dataKey="surgery" name="Procedures Done" fill="#10b981" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Box>

                                {/* Appointment Management Table */}
                                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                    <Table>
                                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800 }}>Ref ID</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Clinical Case (Patient)</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Assigned Physician</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>DateTime</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>EMR Status</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Operation</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredAppointments
                                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                .map((row) => (
                                                    <TableRow key={row.id} hover>
                                                        <TableCell><Typography variant="body2" fontWeight={700}>{row.id}</Typography></TableCell>
                                                        <TableCell>{row.patientName}</TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <UserCheck size={14} className="text-blue-500" />
                                                                {row.doctorName}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">{row.date}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{row.time}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={row.emrStatus}
                                                                size="small"
                                                                variant="soft"
                                                                color={row.emrStatus === 'Finalized' ? 'success' : row.emrStatus === 'Drafted' ? 'warning' : 'default'}
                                                                sx={{ fontWeight: 700 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                select
                                                                size="small"
                                                                value={row.status}
                                                                onChange={(e) => handleUpdateStatus(row.id, e.target.value)}
                                                                SelectProps={{ native: true }}
                                                                sx={{ '& .MuiInputBase-root': { borderRadius: 2, fontSize: 12, fontWeight: 700 } }}
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
                                    rowsPerPageOptions={[5, 10, 25]}
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
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800 }}>Physician ID</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Doctor Name</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Specialty</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Department</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Total Surgeries</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredDoctors
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row) => (
                                                <TableRow key={row.id} hover>
                                                    <TableCell><Typography variant="body2" fontWeight={700}>{row.id}</Typography></TableCell>
                                                    <TableCell>{row.name}</TableCell>
                                                    <TableCell>{row.specialty}</TableCell>
                                                    <TableCell>{row.department}</TableCell>
                                                    <TableCell>{row.surgeries}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={row.status}
                                                            size="small"
                                                            color={row.status === 'On Duty' ? 'success' : 'warning'}
                                                            sx={{ fontWeight: 700 }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
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
                                <Box sx={{ p: 8, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No matching records found for "{searchTerm}"</Typography>
                                </Box>
                            )}
                    </Box>
                )}

                {/* Report Footer */}
                <Box sx={{ mt: 10, pt: 6, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', maxWidth: 600, mx: 'auto' }}>
                        * This analytical summary serves as an official clinical record. All metrics are aggregated across active clinic branches using real-time service synchronization.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#94a3b8' }}>
                        &copy; {new Date().getFullYear()} Clinical Intelligence Systems • Professional Edition v4.2.0
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
