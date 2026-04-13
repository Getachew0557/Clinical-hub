import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Video, CalendarDays, Clock, User, Loader2 } from 'lucide-react';
import { Typography, Card, CardContent, CircularProgress, Chip } from '@mui/material';
import appointmentService from '../../api/appointment.service';
import { isVideoEligible, sortAppointments } from './videoUtils';

export default function VideoConsultationsList() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setLoading(true);
                const data = await appointmentService.getMyAppointments();
                const all = data.appointments || [];
                const eligible = all.filter((a) => isVideoEligible(a.status));
                setAppointments(sortAppointments(eligible));
            } catch (err) {
                console.error('Video consultations fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);

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
                        {t('videoConsult.pageTitle')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        Your upcoming video consultations
                    </Typography>
                </div>
            </div>

            {/* Empty State */}
            {appointments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center">
                        <Video className="text-teal-400 w-8 h-8" />
                    </div>
                    <p className="text-slate-500 font-medium">{t('videoConsult.noUpcoming')}</p>
                </div>
            )}

            {/* Appointment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {appointments.map((apt) => (
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
                            {/* Status */}
                            <div className="flex items-center justify-between mb-4">
                                <Chip
                                    label={apt.status}
                                    size="small"
                                    sx={{
                                        bgcolor: apt.status === 'In Progress' ? '#f0fdf4' : '#eff6ff',
                                        color: apt.status === 'In Progress' ? '#059669' : '#0d9488',
                                        fontWeight: 700,
                                        fontSize: '0.65rem',
                                    }}
                                />
                                <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center">
                                    <Video className="text-teal-600 w-4 h-4" />
                                </div>
                            </div>

                            {/* Patient Name */}
                            <div className="flex items-center gap-2 mb-3">
                                <User size={16} className="text-slate-400" />
                                <Typography variant="subtitle1" fontWeight={700} className="truncate">
                                    {apt.patientName || 'Patient'}
                                </Typography>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-center gap-4 mb-5">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <CalendarDays size={14} />
                                    <Typography variant="caption">{apt.appointmentDate || apt.date}</Typography>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <Clock size={14} />
                                    <Typography variant="caption">{apt.appointmentTime}</Typography>
                                </div>
                            </div>

                            {/* Join Button */}
                            <button
                                onClick={() => navigate(`/video/${apt.id}`)}
                                className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-teal-600/15"
                            >
                                <Video size={16} />
                                {t('videoConsult.joinCall')}
                            </button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
