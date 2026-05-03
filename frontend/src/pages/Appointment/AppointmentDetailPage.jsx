import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Calendar, Clock, User, Stethoscope, FileText, 
    CheckCircle, ArrowLeft, Phone, Mail, Hash, 
    Video, MapPin, ClipboardList, CreditCard
} from 'lucide-react';
import { 
    Typography, Button, Card, CardContent, 
    CircularProgress, Box, Chip, Divider, 
    Avatar, IconButton, Alert
} from '@mui/material';
import appointmentService from '../../api/appointment.service';
import patientService from '../../api/patient.service';
import { useSelector } from 'react-redux';
import { getPatientPhotoUrl } from '../../utils/cn';

export default function AppointmentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';

    useEffect(() => {
        fetchAppointment();
    }, [id]);

    const fetchAppointment = async () => {
        try {
            setLoading(true);
            const data = await appointmentService.getAppointmentById(id);
            
            // If user is staff/doctor, fetch full patient details for demographic info (Gender, DOB)
            if (['Admin', 'Receptionist', 'Doctor'].includes(role) && data.patientId) {
                try {
                    const pat = await patientService.getPatientById(data.patientId);
                    data.patientDetails = pat;
                } catch (e) {
                    console.warn('Could not fetch patient details for this appointment');
                }
            }
            
            setAppointment(data);
            setError(null);
        } catch (err) {
            console.error('Fetch Appointment Detail Error:', err);
            setError('Failed to load appointment details.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box className="flex h-screen items-center justify-center">
                <CircularProgress size={32} />
            </Box>
        );
    }

    if (error || !appointment) {
        return (
            <Box className="p-6">
                <Button 
                    startIcon={<ArrowLeft size={18} />} 
                    onClick={() => navigate(-1)}
                    sx={{ mb: 2 }}
                >
                    Back
                </Button>
                <Alert severity="error">{error || 'Appointment not found'}</Alert>
            </Box>
        );
    }

    const isVideo = appointment.type === 'video';
    const statusColors = {
        'Pending': 'warning',
        'Confirmed': 'info',
        'In Progress': 'primary',
        'Completed': 'success',
        'Cancelled': 'error'
    };

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 2, lg: 4 }, pb: 8, maxWidth: 1000, margin: '0 auto' }}>
            {/* Header / Back */}
            <div className="flex items-center gap-4 mb-6">
                <IconButton onClick={() => navigate(-1)} className="bg-white border border-slate-200 shadow-sm">
                    <ArrowLeft size={20} />
                </IconButton>
                <div>
                    <Typography variant="h5" fontWeight={700}>Appointment Details</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Reference ID: <span className="font-mono text-slate-800">#{appointment.id.slice(-8).toUpperCase()}</span>
                    </Typography>
                </div>
                <div className="ml-auto">
                    <Chip 
                        label={appointment.status} 
                        color={statusColors[appointment.status] || 'default'} 
                        sx={{ fontWeight: 800, borderRadius: 2 }} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Patient & Doctor Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Appointment Info Card */}
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                                    <Calendar size={20} />
                                </div>
                                <Typography variant="h6" fontWeight={700}>Schedule Information</Typography>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex gap-4">
                                    <div className="shrink-0 w-12 h-12 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100">
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" className="uppercase">
                                            {new Date(appointment.appointmentDate).toLocaleString('default', { month: 'short' })}
                                        </Typography>
                                        <Typography variant="h6" fontWeight={800} color="primary.main" className="leading-none">
                                            {appointment.appointmentDate.split('-')[2]}
                                        </Typography>
                                    </div>
                                    <div>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>DATE</Typography>
                                        <Typography variant="subtitle1" fontWeight={700}>
                                            {new Date(appointment.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="shrink-0 w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>TIME</Typography>
                                        <Typography variant="subtitle1" fontWeight={700}>
                                            {appointment.appointmentTime.slice(0, 5)}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="shrink-0 w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400">
                                        {isVideo ? <Video size={20} /> : <MapPin size={20} />}
                                    </div>
                                    <div>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>TYPE</Typography>
                                        <Typography variant="subtitle1" fontWeight={700} className="capitalize">
                                            {isVideo ? 'Video Consultation' : 'In-Clinic Visit'}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="shrink-0 w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400">
                                        <ClipboardList size={20} />
                                    </div>
                                    <div>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>REASON</Typography>
                                        <Typography variant="subtitle1" fontWeight={700}>
                                            {appointment.reason}
                                        </Typography>
                                    </div>
                                </div>
                            </div>

                            {appointment.notes && (
                                <div className="mt-8 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText size={16} className="text-amber-600" />
                                        <Typography variant="caption" fontWeight={800} color="amber.800" className="uppercase tracking-wider">
                                            Clinical Notes
                                        </Typography>
                                    </div>
                                    <Typography variant="body2" color="text.primary">
                                        {appointment.notes}
                                    </Typography>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Confirmation Tracking Card */}
                    {appointment.confirmedAt && (
                        <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', background: 'linear-gradient(145deg, #f0fdfa 0%, #ffffff 100%)' }}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                        <CheckCircle size={20} />
                                    </div>
                                    <Typography variant="h6" fontWeight={700}>Confirmation Tracking</Typography>
                                </div>

                                <div className="flex flex-wrap gap-10">
                                    <div>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>CONFIRMED BY</Typography>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Avatar sx={{ width: 24, height: 24, fontSize: '10px', bgcolor: 'blue.500' }}>
                                                {appointment.confirmedByName?.charAt(0).toUpperCase() || 'S'}
                                            </Avatar>
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                {appointment.confirmedByName || 'System Administrator'}
                                            </Typography>
                                        </div>
                                    </div>

                                    <div>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>CONFIRMED ON</Typography>
                                        <Typography variant="subtitle2" fontWeight={700} className="mt-1">
                                            {new Date(appointment.confirmedAt).toLocaleString('en-GB', { 
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </Typography>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: People Details */}
                <div className="space-y-6">
                    {/* Patient Info */}
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
                        <CardContent className="p-6">
                            <Typography variant="overline" color="text.secondary" sx={{ mb: 2 }}>Patient Information</Typography>
                            <div className="flex items-center gap-3 mb-5">
                                <Avatar 
                                    sx={{ width: 48, height: 48, bgcolor: 'teal.50' }}
                                    src={getPatientPhotoUrl(appointment.patientDetails?.profilePhoto)}
                                >
                                    <User className="text-teal-600" />
                                </Avatar>
                                <div>
                                    <Typography variant="subtitle1" fontWeight={700}>{appointment.patientName || 'Patient'}</Typography>
                                    <Typography variant="caption" color="text.secondary">ID: #{appointment.patientId?.slice(-6).toUpperCase()}</Typography>
                                </div>
                            </div>
                            <Divider sx={{ mb: 3 }} />
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Hash size={16} />
                                    <Typography variant="body2">Patient ID: <span className="font-mono font-bold text-slate-800">{appointment.patientId?.slice(-8).toUpperCase()}</span></Typography>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Phone size={16} />
                                    <Typography variant="body2">{appointment.patientDetails?.phone || 'No phone provided'}</Typography>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Mail size={16} />
                                    <Typography variant="body2" className="truncate">{appointment.patientDetails?.email || 'No email provided'}</Typography>
                                </div>
                                {appointment.patientDetails?.gender && (
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <User size={16} />
                                        <Typography variant="body2" className="capitalize">Gender: {appointment.patientDetails.gender}</Typography>
                                    </div>
                                )}
                                {appointment.patientDetails?.dateOfBirth && (
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <Calendar size={16} />
                                        <Typography variant="body2">DOB: {new Date(appointment.patientDetails.dateOfBirth).toLocaleDateString()}</Typography>
                                    </div>
                                )}
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    size="small" 
                                    onClick={() => navigate(`/emr?patientId=${appointment.patientId}`)}
                                    sx={{ mt: 2, borderRadius: 2 }}
                                >
                                    View Full EMR
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Doctor Info */}
                    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
                        <CardContent className="p-6">
                            <Typography variant="overline" color="text.secondary" sx={{ mb: 2 }}>Assigned Doctor</Typography>
                            <div className="flex items-center gap-3 mb-5">
                                <Avatar sx={{ width: 48, height: 48, bgcolor: 'blue.50' }}>
                                    <Stethoscope className="text-blue-600" />
                                </Avatar>
                                <div>
                                    <Typography variant="subtitle1" fontWeight={700}>Dr. {appointment.doctorName || 'Doctor'}</Typography>
                                    <Typography variant="caption" color="text.secondary">ID: #{appointment.doctorId?.slice(-6).toUpperCase()}</Typography>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Billing Info Preview */}
                    {appointment.status === 'Completed' && (
                        <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'slate.50' }}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Typography variant="overline" color="text.secondary">Billing</Typography>
                                    <CreditCard size={16} className="text-slate-400" />
                                </div>
                                <Typography variant="body2" color="text.secondary">
                                    An invoice has been generated for this completed appointment.
                                </Typography>
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    size="small" 
                                    onClick={() => navigate('/billing')}
                                    sx={{ mt: 2, borderRadius: 2, bgcolor: 'slate.800', '&:hover': { bgcolor: 'black' } }}
                                >
                                    View Invoices
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </Box>
    );
}
