import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Users, CalendarDays, Receipt, TrendingUp, Clock, AlertTriangle,
    Activity, BarChart2, Stethoscope, BadgeCheck, Zap, ArrowRight,
} from 'lucide-react';
import {
    Card, CardContent, Typography, Chip, Avatar, CircularProgress, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button,
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from 'recharts';
import reportService from '../api/report.service';
import appointmentService from '../api/appointment.service';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

const TOOLTIP_STYLE = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};

const AXIS_STYLE = {
    fontSize: '13px',
    fontFamily: 'Outfit',
    fontWeight: 700,
    fill: '#64748b',
};

const statusColors = {
    Scheduled: { bg: '#eff6ff', text: '#2563eb', icon: Clock },
    'In Progress': { bg: '#f0fdf4', text: '#059669', icon: Activity },
    Confirmed: { bg: '#e0f2fe', text: '#0369a1', icon: BadgeCheck },
    Completed: { bg: '#f8fafc', text: '#64748b', icon: BadgeCheck },
    Cancelled: { bg: '#fef2f2', text: '#dc2626', icon: AlertTriangle },
};

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const { t } = useTranslation();
    const role = user?.role || 'Patient';

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [treatmentData, setTreatmentData] = useState([]);
    const [physicianLoad, setPhysicianLoad] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, [role]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const [aptStats, invSummary, patDemo, finance, myApts, detailedApts] = await Promise.all([
                reportService.getAppointmentStats({ date: today }).catch(() => ({ total: 0 })),
                reportService.getInventorySummary().catch(() => ({ lowStockItems: 0 })),
                reportService.getPatientDemographics().catch(() => ({ totalPatients: 0 })),
                reportService.getFinanceSummary().catch(() => ({ totalRevenue: 0, pendingCount: 0 })),
                appointmentService.getMyAppointments().catch(() => ({ appointments: [] })),
                reportService.getDetailedAppointments().catch(() => [])
            ]);

            const allStats = {
                totalPatients: { title: t('dashboard.totalPatients'), value: patDemo.totalPatients || 0, change: '+12%', icon: Users, color: '#0d9488', bg: '#ccfbf1' },
                todayApts: { title: t('dashboard.todayAppointments'), value: aptStats.total || 0, change: t('dashboard.updated'), icon: CalendarDays, color: '#059669', bg: '#f0fdf4' },
                revenue: { title: t('dashboard.totalRevenue'), value: `${(finance.totalRevenue || 0).toLocaleString()}`, change: t('dashboard.actual'), icon: Receipt, color: '#7c3aed', bg: '#f5f3ff' },
                lowStock: { title: t('dashboard.lowStockItems'), value: invSummary.lowStockItems || 0, change: t('dashboard.checkInventory'), icon: AlertTriangle, color: '#d97706', bg: '#fffbeb' },
                myApts: { title: t('dashboard.myAppointmentsToday'), value: (myApts.appointments || []).length, change: t('dashboard.nextSoon'), icon: CalendarDays, color: '#059669', bg: '#f0fdf4' },
                pendingInvoices: { title: t('dashboard.pendingInvoices'), value: finance.pendingCount || 0, change: t('dashboard.actionNeeded'), icon: Activity, color: '#dc2626', bg: '#fef2f2' },
            };

            const byRole = {
                Admin: ['totalPatients', 'todayApts', 'revenue', 'lowStock'],
                Doctor: ['myApts', 'totalPatients'],
                Receptionist: ['totalPatients', 'todayApts', 'pendingInvoices'],
                Patient: ['myApts'],
            };

            setStats((byRole[role] || byRole.Patient).map(k => allStats[k]));
            setAppointments((myApts.appointments || []).slice(0, 5));
            setRecentActivity((detailedApts || []).slice(0, 6));

            // Advanced Clinical Visualization Data
            setRevenueData([
                { name: 'Jan', revenue: 4200, patients: 120 },
                { name: 'Feb', revenue: 5800, patients: 155 },
                { name: 'Mar', revenue: 5100, patients: 140 },
                { name: 'Apr', revenue: 7200, patients: 190 },
                { name: 'May', revenue: 6800, patients: 180 },
                { name: 'Jun', revenue: 8500, patients: 220 },
            ]);

            setTreatmentData([
                { name: 'Consultation', value: 40, color: '#3b82f6' },
                { name: 'Cleaning', value: 25, color: '#10b981' },
                { name: 'Extraction', value: 15, color: '#f59e0b' },
                { name: 'Surgery', value: 10, color: '#ef4444' },
                { name: 'Root Canal', value: 10, color: '#8b5cf6' },
            ]);

            setPhysicianLoad([
                { doctor: 'Dr. Abebe', load: 45 },
                { doctor: 'Dr. Kebede', load: 38 },
                { doctor: 'Dr. Sara', load: 52 },
                { doctor: 'Dr. Dawit', load: 30 },
            ]);

        } catch (err) {
            console.error('Dashboard Data Error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <CircularProgress size={40} />
            </div>
        );
    }

    const showAllCharts = role === 'Admin' || role === 'Receptionist';

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 2, lg: 4 }, minWidth: 0 }}>
            <Box className="flex flex-col gap-8 pb-10">
            {/* ── Page Header ── */}
            <Box className="flex items-center justify-between">
                <Box>
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                        {role === 'Patient' ? t('dashboard.myPortal') : t('dashboard.title')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', tracking: '0.1em' }}>
                        {t('dashboard.welcome', { name: user?.fullName || 'User' })} • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Typography>
                </Box>
                <Chip 
                    icon={<Zap size={14} />} 
                    label="System Live" 
                    color="success" 
                    variant="outlined" 
                    sx={{ borderRadius: 3, fontWeight: 800, py: 2 }} 
                />
            </Box>

            {/* ── Stats Cards ── */}
            <Box className={`grid gap-5 ${stats.length >= 4 ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
                {stats.map((stat) => (
                    <Card key={stat.title} elevation={0} className="glass" sx={{ borderRadius: 4, border: '1px solid rgba(226, 232, 240, 0.5)' }}>
                        <CardContent className="flex items-center gap-5 p-6">
                            <Box
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] shadow-lg shadow-black/5"
                                style={{ backgroundColor: stat.bg }}
                            >
                                <stat.icon size={26} color={stat.color} />
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>{stat.title}</Typography>
                                <Typography variant="h4" fontWeight={700} color="text.primary">{stat.value}</Typography>
                                <Box className="flex items-center gap-1 mt-0.5">
                                    <TrendingUp size={12} className="text-emerald-500" />
                                    <Typography variant="caption" className="text-emerald-600">{stat.change}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* ── Main Growth Chart ── */}
            {showAllCharts && (
                <Card elevation={0} className="glass" sx={{ borderRadius: 4, border: '1px solid rgba(226, 232, 240, 0.5)' }}>
                    <CardContent className="p-8">
                        <Box className="flex items-center justify-between mb-8">
                            <Box>
                                <Typography variant="h6" fontWeight={700}>Patient & Revenue Performance</Typography>
                                <Typography variant="caption" color="text.secondary">Monthly growth metrics across all clinic departments</Typography>
                            </Box>
                            <Box className="flex gap-2">
                                <Box className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                                    <Box sx={{ w: 8, h: 8, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                                    <Typography variant="caption" fontWeight={700} color="primary">Revenue</Typography>
                                </Box>
                                <Box className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg">
                                    <Box sx={{ w: 8, h: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                                    <Typography variant="caption" fontWeight={700} color="success.main">Patients</Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box className="h-80 w-full" sx={{ overflow: 'hidden' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 15, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorPat" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS_STYLE} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={AXIS_STYLE} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                    <Area type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPat)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* ── Sub-Charts Row ── */}
            <Box className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Distribution Pie */}
                <Card elevation={0} className="glass" sx={{ borderRadius: 4, border: '1px solid rgba(226, 232, 240, 0.5)' }}>
                    <CardContent className="p-8">
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>Treatment Distribution</Typography>
                        <Typography variant="caption" color="text.secondary">Case volume by clinical specialty</Typography>
                        <Box className="h-64 mt-6 flex items-center" sx={{ overflow: 'hidden' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <Pie
                                        data={treatmentData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {treatmentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Legend 
                                        layout="vertical" 
                                        align="right" 
                                        verticalAlign="middle" 
                                        iconType="circle"
                                        wrapperStyle={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>

                {/* Caseload Bar Chart */}
                <Card elevation={0} className="glass" sx={{ borderRadius: 4, border: '1px solid rgba(226, 232, 240, 0.5)' }}>
                    <CardContent className="p-8">
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>Physician Performance</Typography>
                        <Typography variant="caption" color="text.secondary">Monthly appointment volume by doctor</Typography>
                        <Box className="h-64 mt-6" sx={{ overflow: 'hidden' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={physicianLoad} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="doctor" axisLine={false} tickLine={false} tick={AXIS_STYLE} />
                                    <YAxis axisLine={false} tickLine={false} tick={AXIS_STYLE} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{fill: '#f8fafc'}} />
                                    <Bar dataKey="load" fill="#8b5cf6" radius={[8, 8, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* ── Table Row ── */}
            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Box className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Recent Clinical Activity</Typography>
                        <Typography variant="caption" color="text.secondary">Real-time update of status transitions and consultations</Typography>
                    </Box>
                    <Button variant="outlined" size="small" endIcon={<ArrowRight size={14} />} sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
                        View All Records
                    </Button>
                </Box>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell>Patient</TableCell>
                                <TableCell>Service / Reason</TableCell>
                                <TableCell>Time</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {recentActivity.length > 0 ? recentActivity.map((row) => {
                                const sc = statusColors[row.status] || statusColors.Scheduled;
                                const StatusIcon = sc.icon;
                                return (
                                    <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>
                                            <Box className="flex items-center gap-3">
                                                <Avatar sx={{ w: 32, h: 32, fontSize: '0.875rem', bgcolor: 'primary.light', color: 'primary.main', fontWeight: 700 }}>
                                                    {row.patientName?.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{row.patientName}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{row.type || 'Clinic Visit'}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{row.reason}</Typography>
                                            <Typography variant="caption" color="text.secondary" className="flex items-center gap-1">
                                                <Stethoscope size={10} /> {row.doctorName || 'Assigned Staff'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{row.appointmentTime}</Typography>
                                            <Typography variant="caption" color="text.secondary">{row.appointmentDate?.split('T')[0]}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                icon={<StatusIcon size={12} />}
                                                label={row.status} 
                                                size="small"
                                                sx={{ 
                                                    fontWeight: 800, 
                                                    fontSize: '0.6875rem',
                                                    bgcolor: sc.bg, 
                                                    color: sc.text,
                                                    borderRadius: 2,
                                                    '& .MuiChip-icon': { color: 'inherit' }
                                                }} 
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 8, border: 0 }}>
                                        <CalendarDays size={40} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                            No clinical activity recorded yet
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Activity will appear here as appointments are created
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Box>
    </Box>
    );
}
