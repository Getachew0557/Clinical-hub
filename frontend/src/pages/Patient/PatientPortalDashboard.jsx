import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    CalendarDays, FileText, Receipt, Clock, 
    ArrowRight, Star, PlusCircle, CheckCircle2, Video
} from 'lucide-react';
import {
    Card, CardContent, Typography, Button, 
    Avatar, CircularProgress, Box, Grid, Chip
} from '@mui/material';
import appointmentService from '../../api/appointment.service';

const API_BILLING = import.meta.env.VITE_API_BILLING_URL;
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const statusColors = {
    Pending:      { bg: '#fffbeb', text: '#d97706' },
    'In Progress':{ bg: '#f0fdf4', text: '#059669' },
    Confirmed:    { bg: '#eff6ff', text: '#2563eb' },
    Completed:    { bg: '#f8fafc', text: '#64748b' },
    Cancelled:    { bg: '#fef2f2', text: '#dc2626' },
};

export default function PatientPortalDashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [summary, setSummary] = useState({
        pendingBills: 0,
        lastCheckup: 'Never',
        nextAppointment: 'None'
    });

    const healthTips = t('portal.healthTips', { returnObjects: true }) || [];

    useEffect(() => {
        fetchPatientData();
    }, []);

    const fetchPatientData = async () => {
        try {
            setLoading(true);
            const myApts = await appointmentService.getMyAppointments().catch(() => ({ appointments: [] }));
            const allApts = myApts.appointments || [];
            setAppointments(allApts);

            // Fetch real pending bills
            let pendingBills = 0;
            try {
                const billRes = await fetch(`${API_BILLING}/invoices/${user?.id}`, { headers: getAuthHeader() });
                if (billRes.ok) {
                    const bills = await billRes.json();
                    pendingBills = (Array.isArray(bills) ? bills : []).filter(b => b.status === 'Pending').length;
                }
            } catch { /* non-fatal */ }
            
            const upcoming = allApts
                .filter(a => a.appointmentDate >= new Date().toISOString().split('T')[0] && a.status !== 'Cancelled')
                .sort((a, b) => {
                    const da = a.appointmentDate + ' ' + (a.appointmentTime || '');
                    const db = b.appointmentDate + ' ' + (b.appointmentTime || '');
                    return da.localeCompare(db);
                })[0];

            const lastCompleted = allApts
                .filter(a => a.status === 'Completed')
                .sort((a, b) => b.appointmentDate?.localeCompare(a.appointmentDate))[0];

            setSummary({
                pendingBills,
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
            <Box className="flex h-64 items-center justify-center">
                <CircularProgress size={40} />
            </Box>
        );
    }

    const dailyTip = healthTips[Math.floor(Date.now() / 86400000) % (healthTips.length || 1)];

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 12 }}>
            <div className="flex flex-col gap-8">
            {/* ── Welcome Header ── */}
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-4">
                <Box className="flex items-center gap-4">
                    <Avatar 
                        sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontWeight: 800 }}
                    >
                        {user?.fullName?.charAt(0)}
                    </Avatar>
                    <div>
                        <Typography variant="h4" fontWeight={900} color="text.primary">
                            {t('portal.welcome', { name: user?.fullName.split(' ')[0] })}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {t('portal.subtitle')}
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
                            borderRadius: 4, 
                            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', 
                            color: 'white',
                            cursor: 'pointer',
                            '&:hover': { transform: 'translateY(-4px)', transition: '0.3s' }
                        }}
                        onClick={() => navigate('/find-doctor')}
                    >
                        <CardContent className="p-6">
                            <PlusCircle size={32} className="mb-4 text-teal-100" />
                            <Typography variant="h6" fontWeight={800}>{t('portal.findDoctor')}</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                                {t('portal.findDoctorDesc')}
                            </Typography>
                            <Box className="flex items-center gap-1 mt-4 font-bold text-sm">
                                {t('portal.getStarted')} <ArrowRight size={16} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                <CardContent className="p-5 text-center">
                                    <Receipt size={24} className="mx-auto mb-2 text-orange-500" />
                                    <Typography variant="h5" fontWeight={800}>{summary.pendingBills}</Typography>
                                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>{t('common.unpaidInvoices')}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                <CardContent className="p-5 text-center">
                                    <CalendarDays size={24} className="mx-auto mb-2 text-blue-500" />
                                    <Typography variant="h5" fontWeight={800}>{summary.nextAppointment}</Typography>
                                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>{t('common.nextVisit')}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                <CardContent className="p-5 text-center">
                                    <CheckCircle2 size={24} className="mx-auto mb-2 text-green-500" />
                                    <Typography variant="h5" fontWeight={800}>{summary.lastCheckup}</Typography>
                                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>{t('common.lastTreatment')}</Typography>
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
                        <Typography variant="h6" fontWeight={900}>{t('portal.upcomingVisits')}</Typography>
                        <Button size="small" onClick={() => navigate('/appointments')}>{t('common.viewAll')}</Button>
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
                                                <Typography variant="subtitle2" fontWeight={800}>{apt.doctorName || t('nav.doctors')}</Typography>
                                                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>{apt.reason || t('common.generalConsultation')}</Typography>
                                                <div className="text-xs text-slate-400 mt-0.5">{apt.appointmentDate} · {apt.appointmentTime?.slice(0,5)}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <Chip 
                                                label={apt.status} 
                                                size="small" 
                                                sx={{ height: 20, bgcolor: sc.bg, color: sc.text, fontWeight: 700 }} 
                                            />
                                            {(apt.status === 'Confirmed' || apt.status === 'In Progress') && (
                                                <button
                                                    onClick={() => navigate(`/video/${apt.id}`)}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-all"
                                                >
                                                    <Video size={11} /> {t('portal.joinVideo')}
                                                </button>
                                            )}
                                            {apt.status === 'Pending' && (
                                                <span className="text-xs text-amber-600 font-bold">{t('portal.awaitingApproval')}</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        }) : (
                            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                                <CalendarDays size={40} className="mx-auto text-slate-300 mb-2" />
                                <Typography color="text.secondary">{t('portal.noVisits')}</Typography>
                                <Button sx={{ mt: 2 }} onClick={() => navigate('/book/new')}>{t('common.bookNow')}</Button>
                            </div>
                        )}
                    </div>
                </Grid>

                {/* Records & Tips */}
                <Grid item xs={12} md={5}>
                    <Typography variant="h6" fontWeight={800} className="mb-4">{t('portal.medicalSummary')}</Typography>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, mb: 3 }}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="text-blue-600" />
                                <Typography variant="subtitle1" fontWeight={700}>{t('portal.latestRecords')}</Typography>
                            </div>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {t('portal.latestRecordsDesc')}
                            </Typography>
                            <Button fullWidth variant="outlined" sx={{ borderRadius: 3 }} onClick={() => navigate('/emr')}>
                                {t('common.openRecords')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Health Tip */}
                    <Card elevation={0} sx={{ bgcolor: '#fffbeb', borderRadius: 4, border: '1px solid #fef3c7' }}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-2 text-amber-700">
                                <Star size={18} fill="currentColor" />
                                <Typography variant="subtitle2" fontWeight={800}>{t('common.dailyHealthTip')}</Typography>
                            </div>
                            <Typography variant="body2" color="amber.900">
                                {dailyTip}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            </div>
        </Box>
    );
}

