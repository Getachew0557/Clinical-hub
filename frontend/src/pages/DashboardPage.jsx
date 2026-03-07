import React from 'react';
import { useSelector } from 'react-redux';
import {
    Users, CalendarDays, Receipt, TrendingUp, Clock, AlertTriangle,
    Activity, BarChart2,
} from 'lucide-react';
import {
    Card, CardContent, Typography, Chip, Avatar,
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { patients, appointments, invoices, inventory } from '../data/mockData';

// ── Static Chart Data ────────────────────────────────────
const weeklyData = [
    { day: 'Mon', appointments: 12, revenue: 2400 },
    { day: 'Tue', appointments: 15, revenue: 3100 },
    { day: 'Wed', appointments: 10, revenue: 2000 },
    { day: 'Thu', appointments: 18, revenue: 3600 },
    { day: 'Fri', appointments: 14, revenue: 2800 },
    { day: 'Sat', appointments: 8, revenue: 1600 },
    { day: 'Sun', appointments: 0, revenue: 0 },
];

const treatmentDistribution = [
    { name: 'Orthodontics', value: 30 },
    { name: 'Endodontics', value: 25 },
    { name: 'Periodontics', value: 20 },
    { name: 'Prosthodontics', value: 15 },
    { name: 'Oral Surgery', value: 10 },
];

const COLORS = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#dc2626'];

const monthlyRevenue = [
    { month: 'Sep', revenue: 18500 },
    { month: 'Oct', revenue: 21200 },
    { month: 'Nov', revenue: 19800 },
    { month: 'Dec', revenue: 24100 },
    { month: 'Jan', revenue: 22600 },
    { month: 'Feb', revenue: 26500 },
];

// ── Helpers ──────────────────────────────────────────────
const statusColors = {
    Scheduled: { bg: '#eff6ff', text: '#2563eb' },
    'In Progress': { bg: '#f0fdf4', text: '#059669' },
    Completed: { bg: '#f8fafc', text: '#64748b' },
    Cancelled: { bg: '#fef2f2', text: '#dc2626' },
};

const TOOLTIP_STYLE = {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '12px',
};

// ── Role-aware stats ─────────────────────────────────────
function useStats(role) {
    const todayApts = appointments.filter((a) => a.date === '2026-02-21');
    const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
    const lowStock = inventory.filter((i) => i.status !== 'In Stock').length;

    const allStats = {
        totalPatients: { title: 'Total Patients', value: patients.length, change: '+12%', icon: Users, color: '#2563eb', bg: '#eff6ff' },
        todayApts: { title: "Today's Appointments", value: todayApts.length, change: '+3', icon: CalendarDays, color: '#059669', bg: '#f0fdf4' },
        revenue: { title: 'Revenue (Feb)', value: `$${totalRevenue.toLocaleString()}`, change: '+8.2%', icon: Receipt, color: '#7c3aed', bg: '#f5f3ff' },
        lowStock: { title: 'Low Stock Items', value: lowStock, change: 'Needs attention', icon: AlertTriangle, color: '#d97706', bg: '#fffbeb' },
        myApts: { title: 'My Appointments Today', value: todayApts.length, change: 'Next: 09:30', icon: CalendarDays, color: '#059669', bg: '#f0fdf4' },
        pendingInvoices: { title: 'Pending Invoices', value: invoices.filter((i) => i.status === 'Pending').length, change: 'Action needed', icon: Receipt, color: '#dc2626', bg: '#fef2f2' },
    };

    const byRole = {
        Admin: ['totalPatients', 'todayApts', 'revenue', 'lowStock'],
        Doctor: ['myApts', 'totalPatients'],
        Receptionist: ['totalPatients', 'todayApts', 'pendingInvoices'],
        Patient: ['myApts'],
    };

    return (byRole[role] || byRole.Patient).map((k) => allStats[k]);
}

// ── Main Component ────────────────────────────────────────
export default function DashboardPage() {
    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';
    const stats = useStats(role);
    const todayAppointments = appointments.filter((a) => a.date === '2026-02-21');
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

            {/* ── Charts Row 1 (Admin Only) ── */}
            {showAllCharts && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    {/* Weekly Appointments Bar Chart */}
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, gridColumn: 'span 2' }}>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700}>Weekly Appointments</Typography>
                            <Typography variant="caption" color="text.secondary">Appointment volume this week</Typography>
                            <div className="h-64 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weeklyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="day" fontSize={12} stroke="#94a3b8" />
                                        <YAxis fontSize={12} stroke="#94a3b8" />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                                        <Bar dataKey="appointments" fill="#2563eb" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Treatment Distribution Pie Chart */}
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700}>Treatment Types</Typography>
                            <Typography variant="caption" color="text.secondary">Distribution this month</Typography>
                            <div className="h-52 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={treatmentDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={52}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {treatmentDistribution.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {treatmentDistribution.map((item, i) => (
                                    <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                        {item.name}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── Charts Row 2 + Today's Schedule ── */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {/* Revenue Trend */}
                {showFinance && (
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, gridColumn: showAllCharts ? 'span 2' : 'span 1' }}>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight={700}>Revenue Trend</Typography>
                            <Typography variant="caption" color="text.secondary">Last 6 months</Typography>
                            <div className="h-64 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="month" fontSize={12} stroke="#94a3b8" />
                                        <YAxis fontSize={12} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                                        <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Today's Schedule */}
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight={700}>Today's Schedule</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {todayAppointments.length} appointments today
                        </Typography>
                        <div className="flex flex-col gap-2 mt-4">
                            {todayAppointments.slice(0, 5).map((apt) => {
                                const sc = statusColors[apt.status] || statusColors.Scheduled;
                                return (
                                    <div
                                        key={apt.id}
                                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                                    >
                                        <Avatar
                                            sx={{ width: 36, height: 36, bgcolor: '#eff6ff', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700 }}
                                        >
                                            {apt.patientName.split(' ').map((n) => n[0]).join('')}
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{apt.patientName}</p>
                                            <p className="text-xs text-slate-500 truncate">{apt.reason}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <Clock size={11} />
                                                {apt.time}
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
                            })}
                            {todayAppointments.length > 5 && (
                                <p className="text-center text-xs text-slate-400 pt-1">
                                    +{todayAppointments.length - 5} more appointments
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Recent Patients (Admin / Receptionist) ── */}
            {(role === 'Admin' || role === 'Receptionist') && (
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight={700}>Recent Patients</Typography>
                        <Typography variant="caption" color="text.secondary">Latest registered patients</Typography>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wider">
                                        <th className="pb-3 pr-4">Patient</th>
                                        <th className="pb-3 pr-4">Age / Gender</th>
                                        <th className="pb-3 pr-4">Last Visit</th>
                                        <th className="pb-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patients.slice(0, 5).map((p) => (
                                        <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#eff6ff', color: '#2563eb', fontSize: '0.7rem', fontWeight: 700 }}>
                                                        {p.name.split(' ').map((n) => n[0]).join('')}
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{p.name}</p>
                                                        <p className="text-xs text-slate-500">{p.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 pr-4 text-slate-600">{p.age} / {p.gender}</td>
                                            <td className="py-3 pr-4 text-slate-600">{p.lastVisit}</td>
                                            <td className="py-3">
                                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
