import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Video, CalendarDays, Clock, User, Loader2, CheckCircle, PlayCircle } from 'lucide-react';
import { Typography, Card, CardContent, CircularProgress, Chip, Tabs, Tab } from '@mui/material';
import { useSelector } from 'react-redux';
import appointmentService from '../../api/appointment.service';
import { sortAppointments } from './videoUtils';

const STATUS_TABS = ['Confirmed', 'In Progress', 'Completed'];

const statusConfig = {
    'Confirmed':   { bg: '#eff6ff', text: '#2563eb', label: '📹 Ready to Start' },
    'In Progress': { bg: '#f0fdf4', text: '#059669', label: '🔴 Live Session' },
    'Completed':   { bg: '#f8fafc', text: '#64748b', label: '✅ Completed' },
};

export default function VideoConsultationsList() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useSelector((s) => s.auth);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            // getMyAppointments is scoped to the logged-in doctor's own appointments
            const data = await appointmentService.getMyAppointments();
            const all = data.appointments || [];
            // Filter to video type only, in relevant statuses
            const videoApts = all.filter(a =>
                a.type === 'video' &&
                STATUS_TABS.includes(a.status)
            );
            setAppointments(sortAppointments(videoApts));

            // Debug: log all appointments to help diagnose if type field is missing
            if (videoApts.length === 0 && all.length > 0) {
                console.info('[VideoConsultations] No video appointments found. All appointments:', all.map(a => ({ id: a.id, type: a.type, status: a.status })));
            }
        } catch (err) {
            console.error('Video consultations fetch error:', err);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStartConsultation = async (apt) => {
        try {
            setUpdatingId(apt.id);
            if (apt.status === 'Confirmed') {
                await appointmentService.updateStatus(apt.id, 'In Progress');
                setAppointments(prev => prev.map(a =>
                    a.id === apt.id ? { ...a, status: 'In Progress' } : a
                ));
            }
            navigate(`/video/${apt.id}`);
        } catch (err) {
            console.error('Failed to start consultation:', err);
            navigate(`/video/${apt.id}`); // navigate anyway
        } finally {
            setUpdatingId(null);
        }
    };

    const handleComplete = async (apt) => {
        try {
            setUpdatingId(apt.id);
            await appointmentService.updateStatus(apt.id, 'Completed');
            setAppointments(prev => prev.map(a =>
                a.id === apt.id ? { ...a, status: 'Completed' } : a
            ));
        } catch (err) {
            alert('Failed to mark as completed');
        } finally {
            setUpdatingId(null);
        }
    };

    const currentStatus = STATUS_TABS[tabValue];
    const filtered = appointments.filter(a => a.status === currentStatus);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <CircularProgress size={36} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                    <Video className="text-teal-600 w-5 h-5" />
                </div>
                <div>
                    <Typography variant="h5" color="text.primary">
                        Video Consultations
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        Manage your video consultation sessions
                    </Typography>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    sx={{
                        px: 2,
                        borderBottom: '1px solid #f1f5f9',
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                        '& .Mui-selected': { color: '#0d9488' },
                        '& .MuiTabs-indicator': { backgroundColor: '#0d9488' }
                    }}
                >
                    {STATUS_TABS.map(s => (
                        <Tab
                            key={s}
                            label={`${s} (${appointments.filter(a => a.status === s).length})`}
                        />
                    ))}
                </Tabs>
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center">
                        <Video className="text-teal-400 w-8 h-8" />
                    </div>
                    <p className="text-slate-500 font-medium">
                        No {currentStatus.toLowerCase()} video consultations.
                    </p>
                    <p className="text-slate-400 text-sm text-center max-w-xs">
                        {currentStatus === 'Confirmed'
                            ? 'Video appointments confirmed by admin will appear here. Appointments must be booked as "Video" type.'
                            : `No ${currentStatus.toLowerCase()} video sessions at this time.`
                        }
                    </p>
                </div>
            )}

            {/* Appointment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((apt) => {
                    const sc = statusConfig[apt.status] || statusConfig.Confirmed;
                    const isUpdating = updatingId === apt.id;
                    return (
                        <Card
                            key={apt.id}
                            elevation={0}
                            sx={{
                                border: '1px solid #e2e8f0',
                                borderRadius: 4,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 16px -4px rgba(13,148,136,0.12)',
                                },
                            }}
                        >
                            <CardContent className="p-5">
                                {/* Status badge */}
                                <div className="flex items-center justify-between mb-4">
                                    <Chip
                                        label={sc.label}
                                        size="small"
                                        sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 800 }}
                                    />
                                    <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center">
                                        <Video className="text-teal-600 w-4 h-4" />
                                    </div>
                                </div>

                                {/* Patient Name */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                                        {(apt.patientName || apt.patientDetails?.fullName || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <Typography variant="subtitle2" fontWeight={700} className="truncate">
                                            {apt.patientName || apt.patientDetails?.fullName || `Patient #${apt.patientId?.slice(-6)}`}
                                        </Typography>
                                        {apt.patientDetails?.phone && (
                                            <Typography variant="caption" color="text.secondary">{apt.patientDetails.phone}</Typography>
                                        )}
                                    </div>
                                </div>

                                {/* Reason */}
                                {apt.reason && (
                                    <Typography variant="caption" color="text.secondary" className="block mb-3 truncate">
                                        {apt.reason}
                                    </Typography>
                                )}

                                {/* Date & Time */}
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <CalendarDays size={13} />
                                        <Typography variant="caption">{apt.appointmentDate}</Typography>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Clock size={13} />
                                        <Typography variant="caption">{apt.appointmentTime?.slice(0,5)}</Typography>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2">
                                    {/* Confirmed: Start session */}
                                    {apt.status === 'Confirmed' && (
                                        <button
                                            onClick={() => handleStartConsultation(apt)}
                                            disabled={isUpdating}
                                            className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-teal-600/15 disabled:opacity-60"
                                        >
                                            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                                            Start Video Session
                                        </button>
                                    )}
                                    {/* In Progress: Rejoin + Complete */}
                                    {apt.status === 'In Progress' && (
                                        <>
                                            <button
                                                onClick={() => navigate(`/video/${apt.id}`)}
                                                className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all flex items-center justify-center gap-2 shadow-md"
                                            >
                                                <Video size={16} /> Rejoin Session
                                            </button>
                                            <button
                                                onClick={() => handleComplete(apt)}
                                                disabled={isUpdating}
                                                className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                            >
                                                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                Mark as Completed
                                            </button>
                                        </>
                                    )}
                                    {/* Completed: View EMR */}
                                    {apt.status === 'Completed' && (
                                        <button
                                            onClick={() => navigate(`/emr?patientId=${apt.patientId}`)}
                                            className="w-full py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            View Patient Records
                                        </button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
