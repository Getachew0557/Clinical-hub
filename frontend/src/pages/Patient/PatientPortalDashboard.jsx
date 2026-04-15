import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    CalendarDays, FileText, Receipt, Clock, 
    ArrowRight, Star, PlusCircle, CheckCircle2, Video
} from 'lucide-react';
import {
    Card, CardContent, Typography, Button, 
    Avatar, CircularProgress, Box, Grid, Chip
} from '@mui/material';
import appointmentService from '../../api/appointment.service';

const statusColors = {
    Pending:      { bg: '#fffbeb', text: '#d97706' },
    'In Progress':{ bg: '#f0fdf4', text: '#059669' },
    Confirmed:    { bg: '#eff6ff', text: '#2563eb' },
    Completed:    { bg: '#f8fafc', text: '#64748b' },
    Cancelled:    { bg: '#fef2f2', text: '#dc2626' },
};

const HEALTH_TIPS = [
    "Drink at least 8 glasses of water daily to stay hydrated and support your body's natural functions.",
    "Aim for 7–9 hours of quality sleep each night to allow your body to repair and regenerate.",
    "30 minutes of moderate exercise daily reduces the risk of chronic disease by up to 35%.",
    "Eat a balanced diet rich in vegetables, fruits, whole grains, and lean proteins for optimal health.",
    "Regular health checkups help detect conditions early when they are most treatable.",
    "Manage stress through mindfulness, deep breathing, or light physical activity every day.",
];

export default function PatientPortalDashboard() {
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [summary, setSummary] = useState({
        pendingBills: 0,
        lastCheckup: 'Never',
        nextAppointment: 'None'
    });

    useEffect(() => {
        fetchPatientData();
    }, []);

    const fetchPatientData = async () => {
        try {
            setLoading(true);
            // getMyAppointments works for all roles; finance summary is staff-only so catch gracefully
            const myApts = await appointmentService.getMyAppointments().catch(() => ({ appointments: [] }));

            const allApts = myApts.appointments || [];
            setAppointments(allApts);
            
            // Find next upcoming appointment (use appointmentDate not date)
            const upcoming = allApts
                .filter(a => a.appointmentDate >= new Date().toISOString().split('T')[0] && a.status !== 'Cancelled')
                .sort((a, b) => {
                    const da = a.appointmentDate + ' ' + (a.appointmentTime || '');
                    const db = b.appointmentDate + ' ' + (b.appointmentTime || '');
                    return da.localeCompare(db);
                })[0];

            // Find last completed appointment
            const lastCompleted = allApts
                .filter(a => a.status === 'Completed')
                .sort((a, b) => b.appointmentDate?.localeCompare(a.appointmentDate))[0];

            setSummary({
                pendingBills: 0,
                lastCheckup: lastCompleted ? lastCompleted.appointmentDate : 'Never',
                nextAppointment: upcoming ? `${upcoming.appointmentDate} ${upcoming.appointmentTime?.slice(0,5) || ''}` : 'None'
            });
        } catch (err) {
            console.error('Patient Dashboard Error:', err);
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

    const dailyTip = HEALTH_TIPS[Math.floor(Date.now() / 86400000) % HEALTH_TIPS.length];

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* ── Welcome Header ── */}
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-4">
                <Box className="flex items-center gap-4">
                    <Avatar 
                        sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem', fontWeight: 800 }}
                    >
                        {user?.fullName?.charAt(0)}
                    </Avatar>
                    <div>
                        <Typography variant="h4" fontWeight={800} color="text.primary">
                            Welcome back, {user?.fullName.split(' ')[0]}!
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Your health is our priority. Here's what's happening with your care.
                        </Typography>
                    </div>
                </Box>
            </div>

            {/* ── Quick Actions ── */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card 
                        elevation={0} 
                        sx={{ 
                            borderRadius: 6, 
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                            color: 'white',
                            cursor: 'pointer',
                            '&:hover': { transform: 'translateY(-4px)', transition: '0.3s' }
                        }}
                        onClick={() => navigate('/appointments')}
                    >
                        <CardContent className="p-6">
                            <PlusCircle size={32} className="mb-4 text-blue-100" />
                            <Typography variant="h6" fontWeight={800}>Book New Appointment</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                                Select a doctor and pick a time slot that works for you.
                            </Typography>
                            <Box className="flex items-center gap-1 mt-4 font-bold text-sm">
                                Get Started <ArrowRight size={16} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                                <CardContent className="p-5 text-center">
                                    <Receipt size={24} className="mx-auto mb-2 text-orange-500" />
                                    <Typography variant="h5" fontWeight={800}>{summary.pendingBills}</Typography>
                                    <Typography variant="caption" color="text.secondary">Unpaid Invoices</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                                <CardContent className="p-5 text-center">
                                    <CalendarDays size={24} className="mx-auto mb-2 text-blue-500" />
                                    <Typography variant="h5" fontWeight={800} sx={{ fontSize: '1.1rem' }}>{summary.nextAppointment}</Typography>
                                    <Typography variant="caption" color="text.secondary">Next Visit</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                                <CardContent className="p-5 text-center">
                                    <CheckCircle2 size={24} className="mx-auto mb-2 text-green-500" />
                                    <Typography variant="h5" fontWeight={800} sx={{ fontSize: '1.1rem' }}>{summary.lastCheckup}</Typography>
                                    <Typography variant="caption" color="text.secondary">Last Treatment</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* ── Main Content ── */}
            <Grid container spacing={4}>
                {/* Upcoming Appointments */}
                <Grid item xs={12} md={7}>
                    <Box className="flex items-center justify-between mb-4">
                        <Typography variant="h6" fontWeight={800}>Upcoming Visits</Typography>
                        <Button size="small" onClick={() => navigate('/appointments')}>View All</Button>
                    </Box>
                    <div className="flex flex-col gap-3">
                        {appointments.length > 0 ? appointments.map((apt) => {
                            const sc = statusColors[apt.status] || statusColors.Scheduled;
                            return (
                                <Card key={apt.id} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4, bgcolor: '#f8fafc' }}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white p-3 rounded-2xl shadow-sm">
                                                <CalendarDays size={20} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <Typography variant="subtitle2" fontWeight={800}>{apt.doctorName || 'General Practitioner'}</Typography>
                                                <Typography variant="caption" color="text.secondary">{apt.reason || 'General Consultation'}</Typography>
                                                <div className="text-xs text-slate-400 mt-0.5">{apt.appointmentDate} · {apt.appointmentTime?.slice(0,5)}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <Chip 
                                                label={apt.status} 
                                                size="small" 
                                                sx={{ fontSize: '10px', height: 20, bgcolor: sc.bg, color: sc.text, fontWeight: 700 }} 
                                            />
                                            {(apt.status === 'Confirmed' || apt.status === 'In Progress') && (
                                                <button
                                                    onClick={() => navigate(`/video/${apt.id}`)}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-teal-600 text-white rounded-lg text-[10px] font-bold hover:bg-teal-700 transition-all"
                                                >
                                                    <Video size={11} /> Join Video
                                                </button>
                                            )}
                                            {apt.status === 'Pending' && (
                                                <span className="text-[10px] text-amber-600 font-semibold">Awaiting approval</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        }) : (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                                <CalendarDays size={40} className="mx-auto text-slate-300 mb-2" />
                                <Typography color="text.secondary">No upcoming visits found.</Typography>
                                <Button sx={{ mt: 2 }} onClick={() => navigate('/book/new')}>Book Now</Button>
                            </div>
                        )}
                    </div>
                </Grid>

                {/* Records & Tips */}
                <Grid item xs={12} md={5}>
                    <Typography variant="h6" fontWeight={800} className="mb-4">Medical Summary</Typography>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5, mb: 3 }}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="text-blue-600" />
                                <Typography variant="subtitle1" fontWeight={700}>Latest Records</Typography>
                            </div>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Access your X-rays, treatment plans, and doctor prescriptions.
                            </Typography>
                            <Button fullWidth variant="outlined" sx={{ borderRadius: 3 }} onClick={() => navigate('/emr')}>
                                Open Records
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Health Tip */}
                    <Card elevation={0} sx={{ bgcolor: '#fffbeb', borderRadius: 5, border: '1px solid #fef3c7' }}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-2 text-amber-700">
                                <Star size={18} fill="currentColor" />
                                <Typography variant="subtitle2" fontWeight={800}>Daily Health Tip</Typography>
                            </div>
                            <Typography variant="body2" color="amber.900">
                                {dailyTip}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
}
