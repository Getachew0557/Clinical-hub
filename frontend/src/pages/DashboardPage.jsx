import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Users, CalendarDays, Receipt, TrendingUp, Clock, AlertTriangle,
    Activity, BarChart2,
} from 'lucide-react';
import {
    Card, CardContent, Typography, Chip, Avatar, CircularProgress, Box
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import reportService from '../api/report.service';
import appointmentService from '../api/appointment.service';

const COLORS = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#dc2626'];

const TOOLTIP_STYLE = {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '12px',
};

const statusColors = {
    Scheduled: { bg: '#eff6ff', text: '#2563eb' },
    'In Progress': { bg: '#f0fdf4', text: '#059669' },
    Confirmed: { bg: '#eff6ff', text: '#2563eb' },
    Completed: { bg: '#f8fafc', text: '#64748b' },
    Cancelled: { bg: '#fef2f2', text: '#dc2626' },
};

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [treatmentData, setTreatmentData] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, [role]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const [aptStats, invSummary, patDemo, finance, myApts] = await Promise.all([
                reportService.getAppointmentStats({ date: today }).catch(() => ({ total: 0 })),
                reportService.getInventorySummary().catch(() => ({ lowStockItems: 0 })),
                reportService.getPatientDemographics().catch(() => ({ totalPatients: 0 })),
                reportService.getFinanceSummary().catch(() => ({ totalRevenue: 0, pendingCount: 0 })),
                appointmentService.getMyAppointments().catch(() => ({ appointments: [] }))
            ]);

            const allStats = {
                totalPatients: { title: 'Total Patients', value: patDemo.totalPatients || 0, change: '+5%', icon: Users, color: '#2563eb', bg: '#eff6ff' },
                todayApts: { title: "Today's Appointments", value: aptStats.total || 0, change: 'Updated', icon: CalendarDays, color: '#059669', bg: '#f0fdf4' },
                revenue: { title: 'Total Revenue', value: `$${(finance.totalRevenue || 0).toLocaleString()}`, change: 'Actual', icon: Receipt, color: '#7c3aed', bg: '#f5f3ff' },
                lowStock: { title: 'Low Stock Items', value: invSummary.lowStockItems || 0, change: 'Check Inventory', icon: AlertTriangle, color: '#d97706', bg: '#fffbeb' },
                myApts: { title: 'My Appointments Today', value: (myApts.appointments || []).length, change: 'Next: Soon', icon: CalendarDays, color: '#059669', bg: '#f0fdf4' },
                pendingInvoices: { title: 'Pending Invoices', value: finance.pendingCount || 0, change: 'Action needed', icon: Activity, color: '#dc2626', bg: '#fef2f2' },
            };

            const byRole = {
                Admin: ['totalPatients', 'todayApts', 'revenue', 'lowStock'],
                Doctor: ['myApts', 'totalPatients'],
                Receptionist: ['totalPatients', 'todayApts', 'pendingInvoices'],
                Patient: ['myApts'],
            };

            setStats((byRole[role] || byRole.Patient).map(k => allStats[k]));
            setAppointments((myApts.appointments || []).slice(0, 5));

            // Mocking trend data for now as report service doesn't provide historical yet
            setRevenueData([
                { month: 'Jan', revenue: 4000 },
                { month: 'Feb', revenue: 5200 },
                { month: 'Mar', revenue: 4800 },
            ]);
            setTreatmentData([
                { name: 'General Consultation', value: 40 },
                { name: 'Surgical Procedure', value: 20 },
                { name: 'Pediatric Care', value: 25 },
                { name: 'Other', value: 15 },
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

    const showAllCharts = role === 'Admin';
    const showFinance = role === 'Admin' || role === 'Receptionist';

    return (
        <div className="flex flex-col gap-6">
            {/* ── Page Header ── */}
            <div>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                    {role === 'Patient' ? 'My Portal' : 'Dashboard'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Welcome back, <strong>{user?.fullName || 'User'}</strong>. Here's your clinic overview.
                </Typography>
            </div>

            {/* ── Stats Cards ── */}
            <div className={`grid gap-4 ${stats.length >= 4 ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
                {stats.map((stat) => (
                    <Card key={stat.title} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                                style={{ backgroundColor: stat.bg }}
                            >
                                <stat.icon size={22} color={stat.color} />
                            </div>
                            <div>
                                <Typography variant="caption" color="text.secondary">{stat.title}</Typography>
                                <Typography variant="h5" fontWeight={800} color="text.primary">{stat.value}</Typography>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <TrendingUp size={12} color="#64748b" />
                                    <Typography variant="caption" color="text.secondary">{stat.change}</Typography>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Charts & Schedule Row ── */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {/* Main Stats Chart */}
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, gridColumn: showAllCharts ? 'span 2' : 'span 2' }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight={700}>Activity Overview</Typography>
                        <Typography variant="caption" color="text.secondary">Real-time clinical throughput</Typography>
                        <div className="h-64 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" fontSize={12} stroke="#94a3b8" />
                                    <YAxis fontSize={12} stroke="#94a3b8" />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Schedule */}
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <Typography variant="subtitle1" fontWeight={700}>Your Schedule</Typography>
                                <Typography variant="caption" color="text.secondary">Upcoming appointments</Typography>
                            </div>
                            <Chip label="Live" size="small" color="success" variant="outlined" sx={{ borderRadius: 1 }} />
                        </div>

                        <div className="flex flex-col gap-3 mt-4">
                            {appointments.length > 0 ? appointments.map((apt) => {
                                const sc = statusColors[apt.status] || statusColors.Scheduled;
                                return (
                                    <div
                                        key={apt.id}
                                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 hover:border-blue-200 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/emr?patientId=${apt.patientId}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{apt.patientName || 'Patient'}</p>
                                            <p className="text-xs text-slate-500 truncate">{apt.reason || 'General Consultation'}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <Clock size={11} />
                                                {apt.appointmentTime}
                                            </div>
                                            <span
                                                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                                style={{ backgroundColor: sc.bg, color: sc.text }}
                                            >
                                                {apt.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="py-10 text-center">
                                    <CalendarDays size={40} className="mx-auto text-slate-200 mb-2" />
                                    <Typography variant="caption" color="text.secondary">No appointments scheduled</Typography>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
