import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, Filter, Plus, Search,
    MoreHorizontal, CheckCircle, XCircle,
    AlertCircle, User, Stethoscope as DoctorIcon,
    Trash2, Edit, Video, FileText
} from 'lucide-react';
import {
    Typography, Button, Card, CardContent, InputBase,
    Avatar, Chip, IconButton, Menu, MenuItem,
    CircularProgress, Alert, Tabs, Tab, Box
} from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import appointmentService from '../../api/appointment.service';
import BookAppointmentModal from '../../components/appointments/BookAppointmentModal';
import EditAppointmentModal from '../../components/appointments/EditAppointmentModal';

export default function AppointmentListPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const urlPatientId = searchParams.get('patientId');
    const urlStatus = searchParams.get('status');

    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';
    const isStaff = ['Admin', 'Receptionist'].includes(role);
    const isDoctor = role === 'Doctor';
    const isPatient = role === 'Patient';

    // Role-based tab definitions
    const TABS = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(urlPatientId || '');
    const [tabValue, setTabValue] = useState(0);
    const [statusCounts, setStatusCounts] = useState({});

    // Modal state
    const [bookModalOpen, setBookModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedApt, setSelectedApt] = useState(null);

    useEffect(() => {
        if (urlStatus) {
            const idx = TABS.indexOf(urlStatus);
            if (idx >= 0) setTabValue(idx);
        }
        fetchAppointments();
        fetchStatusCounts();
    }, [urlStatus]);

    const fetchStatusCounts = async () => {
        if (isPatient) return;
        try {
            const data = await appointmentService.getStatusCounts();
            setStatusCounts(data);
        } catch (err) {
            console.warn('Could not fetch status counts:', err.message);
        }
    };

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            let data;
            if (isStaff) {
                data = await appointmentService.getAllAppointments();
            } else {
                data = await appointmentService.getMyAppointments();
            }
            setAppointments(data.appointments || []);
            setError(null);
        } catch (err) {
            console.error('Fetch Appointments Error:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event, apt) => {
        setAnchorEl(event.currentTarget);
        setSelectedApt(apt);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!selectedApt) return;
        try {
            await appointmentService.updateStatus(selectedApt.id, newStatus);
            await fetchAppointments();
            handleMenuClose();
            fetchStatusCounts();
        } catch (err) {
            alert(t('common.error'));
        }
    };

    const handleApprove = async () => {
        if (!selectedApt) return;
        try {
            await appointmentService.approveAppointment(selectedApt.id);
            await fetchAppointments();
            handleMenuClose();
            fetchStatusCounts();
        } catch (err) {
            alert(t('common.error'));
        }
    };

    const handleDelete = async () => {
        if (!selectedApt || !window.confirm(t('common.confirmDelete'))) return;
        try {
            await appointmentService.deleteAppointment(selectedApt.id);
            setAppointments(prev => prev.filter(a => a.id !== selectedApt.id));
            handleMenuClose();
            alert(t('common.success'));
        } catch (err) {
            alert(t('common.error'));
        }
    };

    const filteredAppointments = appointments.filter(a => {
        const matchesSearch = (
            a.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (a.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (a.doctorName || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        const currentStatus = TABS[tabValue];
        return a.status === currentStatus && matchesSearch;
    });

    const getStatusChip = (apt) => {
        const { status, isAdminApproved, type } = apt;
        const configs = {
            'Pending':     { color: 'warning', label: isStaff ? (isAdminApproved ? t('appt.pendingApproved') : t('appt.pendingReview')) : t('appt.pendingApproval') },
            'Confirmed':   { color: 'info',    label: type === 'video' ? `📹 ${t('appt.status.confirmed')} (${t('appt.type.video')})` : `🏥 ${t('appt.status.confirmed')} (${t('appt.type.clinic')})` },
            'In Progress': { color: 'primary', label: `🔴 ${t('appt.status.inprogress')}` },
            'Completed':   { color: 'success', label: `✅ ${t('appt.status.completed')}` },
            'Cancelled':   { color: 'error',   label: `❌ ${t('appt.status.cancelled')}` },
        };
        const config = configs[status] || configs.Pending;
        return (
            <Chip
                label={config.label}
                color={config.color}
                size="small"
                variant={status === 'Pending' && !isAdminApproved ? 'filled' : 'outlined'}
                sx={{ fontWeight: 800, borderRadius: 2 }}
            />
        );
    };

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
            <div className="flex flex-col gap-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Typography variant="h5" fontWeight={900} color="text.primary">
                        {isDoctor ? t('appt.title.doctor') : isPatient ? t('appt.title.patient') : t('appt.title.staff')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontWeight: 500 }}>
                        {isDoctor
                            ? t('appt.subtitle.doctor')
                            : isStaff
                                ? t('appt.subtitle.staff')
                                : t('appt.subtitle.patient')}
                    </Typography>
                </div>
                {(isPatient || isStaff) && (
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        sx={{ borderRadius: 3, bgcolor: '#0d9488', '&:hover': { bgcolor: '#0f766e' } }}
                        onClick={() => setBookModalOpen(true)}
                    >
                        {t('appt.book')}
                    </Button>
                )}
            </div>

            {/* ── Tabs & Search ── */}
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 px-6 border-b border-slate-50">
                        <Tabs
                            value={tabValue}
                            onChange={(e, v) => setTabValue(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minWidth: 90, fontSize: '0.85rem' },
                                '& .Mui-selected': { color: '#0d9488' }
                            }}
                        >
                            {TABS.map(tab => {
                                const counts = statusCounts[tab];
                                const live = isPatient
                                    ? appointments.filter(a => a.status === tab).length
                                    : (counts?.live ?? appointments.filter(a => a.status === tab).length);
                                const cumulative = isPatient ? undefined : counts?.cumulative;
                                return (
                                    <Tab
                                        key={tab}
                                        label={
                                            <span className="flex flex-col items-center gap-0.5">
                                                <span>{t(`appt.status.${tab.toLowerCase().replace(' ', '')}`)}</span>
                                                <span className="flex items-center gap-1 text-xs font-normal">
                                                    <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-bold">{live}</span>
                                                    {cumulative !== undefined && cumulative !== live && (
                                                        <span className="text-slate-400">/ {t('appt.totalCount', { count: cumulative })}</span>
                                                    )}
                                                </span>
                                            </span>
                                        }
                                    />
                                );
                            })}
                        </Tabs>

                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-1.5 border border-slate-100 focus-within:border-teal-500 focus-within:bg-white transition-all w-full md:w-80">
                            <Search size={18} className="text-slate-400" />
                            <InputBase
                                placeholder={t('appt.searchPlaceholder')}
                                className="w-full text-sm font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Content ── */}
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <CircularProgress size={32} />
                </div>
            ) : error ? (
                <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredAppointments.length > 0 ? (
                        filteredAppointments.map((apt) => (
                            <Card
                                key={apt.id}
                                elevation={0}
                                sx={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 4,
                                    transition: 'all 0.2s',
                                    '&:hover': { border: '1px solid #0d9488', boxShadow: '0 4px 12px rgba(13,148,136,0.04)' }
                                }}
                            >
                                <CardContent className="p-5">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        {/* Date/Time Block */}
                                        <div className="flex flex-row md:flex-col items-center justify-center md:w-24 gap-1 md:bg-teal-50/50 rounded-2xl p-3 border border-transparent md:border-teal-50">
                                            <Typography variant="h6" fontWeight={800} color="#0d9488">
                                                {apt.appointmentDate ? apt.appointmentDate.split('-')[2] : '--'}
                                            </Typography>
                                            <Typography variant="caption" fontWeight={800} color="#0d9488" sx={{ textTransform: 'uppercase' }}>
                                                {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleString('default', { month: 'short' }) : '---'}
                                            </Typography>
                                            <div className="flex items-center gap-1 text-slate-500 ml-4 md:ml-0 md:mt-2">
                                                <Clock size={12} />
                                                <Typography variant="caption" fontWeight={700}>
                                                    {apt.appointmentTime ? apt.appointmentTime.slice(0, 5) : '--:--'}
                                                </Typography>
                                            </div>
                                        </div>

                                        {/* Info Block */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Typography variant="subtitle2" color="text.primary" fontWeight={700}>
                                                            {apt.reason}
                                                        </Typography>
                                                        {apt.type === 'video' && (
                                                            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-extrabold rounded-full border border-teal-100 flex items-center gap-1">
                                                                <Video size={10} /> {t('appt.type.video')}
                                                            </span>
                                                        )}
                                                        {apt.type === 'clinic' && (
                                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-extrabold rounded-full border border-amber-100">
                                                                🏥 {t('appt.type.clinic')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 mt-1">
                                                        {!isPatient && (
                                                            <div className="flex items-start gap-1.5 text-slate-500">
                                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-[10px] shrink-0 mt-0.5">
                                                                    {(apt.patientName || apt.patientDetails?.fullName || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <Typography variant="caption" fontWeight={800} color="text.primary">
                                                                        {apt.patientName || apt.patientDetails?.fullName || `Patient #${apt.patientId?.slice(-6)?.toUpperCase()}`}
                                                                    </Typography>
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                        ID: #{apt.patientId?.slice(-6)}
                                                                        {apt.patientDetails?.phone && ` · ${apt.patientDetails.phone}`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {isPatient && (
                                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                                <DoctorIcon size={13} />
                                                                <Typography variant="caption" fontWeight={700}>Dr. {apt.doctorName || 'Doctor'}</Typography>
                                                            </div>
                                                        )}
                                                        {isStaff && apt.doctorName && (
                                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                                <DoctorIcon size={13} />
                                                                <Typography variant="caption" fontWeight={700}>Dr. {apt.doctorName}</Typography>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-3">
                                                    {getStatusChip(apt)}
                                                    {(apt.status === 'Confirmed' || apt.status === 'In Progress') && apt.type === 'video' && (
                                                        <button
                                                            onClick={() => navigate(`/video/${apt.id}`)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-all shadow-sm"
                                                        >
                                                            <Video size={13} />
                                                            {role === 'Doctor' ? 'Start Video Call' : 'Join Video Call'}
                                                        </button>
                                                    )}
                                                    {apt.status === 'Pending' && !apt.isAdminApproved && role === 'Patient' && (
                                                        <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">{t('appt.awaitingApproval')}</span>
                                                    )}
                                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, apt)}>
                                                        <MoreHorizontal size={18} />
                                                    </IconButton>
                                                </div>
                                            </div>

                                            {apt.notes && (
                                                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 800, fontSize: '10px' }}>
                                                        {t('appt.clinicalNotes')}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.primary" fontWeight={500}>
                                                        {apt.notes}
                                                    </Typography>
                                                </div>
                                            )}

                                            {['Confirmed', 'In Progress', 'Completed'].includes(apt.status) && apt.confirmedAt && (
                                                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                                    <CheckCircle size={13} className="text-blue-500 shrink-0" />
                                                    <div>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1d4ed8', display: 'block', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            {t('appt.confirmedBy')}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700, fontSize: '11px' }}>
                                                            {apt.confirmedByName || 'Staff'}
                                                            <span style={{ color: '#93c5fd', fontWeight: 500, marginLeft: 6 }}>
                                                                · {new Date(apt.confirmedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                {' '}{new Date(apt.confirmedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </Typography>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                            <Calendar size={32} className="opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-wider">{t('appt.noAppts')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Actions Menu ── */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', mt: 1, minWidth: 200 } }}
            >
                {selectedApt?.status === 'Pending' && isStaff && !selectedApt?.isAdminApproved && (
                    <MenuItem onClick={handleApprove} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <CheckCircle size={16} className="text-blue-600" />
                        <span className="text-sm font-bold text-blue-600">{t('appt.approveBooking')}</span>
                    </MenuItem>
                )}
                <MenuItem onClick={() => { navigate(`/appointments/${selectedApt?.id}`); handleMenuClose(); }} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                    <FileText size={16} className="text-slate-500" />
                    <span className="text-sm font-bold">{t('appt.viewDetails')}</span>
                </MenuItem>
                {selectedApt?.status === 'Pending' && isStaff && (
                    <MenuItem onClick={() => handleUpdateStatus('Confirmed')} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-sm font-bold">{t('appt.confirmBooking')}</span>
                    </MenuItem>
                )}
                {selectedApt?.status === 'Confirmed' && (role === 'Admin' || isDoctor) && (
                    <MenuItem onClick={() => handleUpdateStatus('Pending')} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <AlertCircle size={16} className="text-amber-500" />
                        <span className="text-sm font-bold text-amber-600">{t('appt.revertPending')}</span>
                    </MenuItem>
                )}
                {selectedApt?.status === 'Confirmed' && isDoctor && (
                    <MenuItem
                        onClick={() => { handleUpdateStatus('In Progress'); handleMenuClose(); }}
                        sx={{ gap: 1.5, py: 1.2, px: 2 }}
                    >
                        <DoctorIcon size={16} className="text-teal-600" />
                        <span className="text-sm font-bold text-teal-700">{t('appt.startConsult')}</span>
                    </MenuItem>
                )}
                {selectedApt?.status === 'In Progress' && isDoctor && (
                    <MenuItem onClick={() => handleUpdateStatus('Completed')} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <CheckCircle size={16} className="text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-700">{t('appt.markCompleted')}</span>
                    </MenuItem>
                )}
                {isDoctor && (
                    <MenuItem onClick={() => navigate(`/emr?patientId=${selectedApt?.patientId}`)} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <FileText size={16} className="text-blue-500" />
                        <span className="text-sm font-bold">{t('appt.viewNotes')}</span>
                    </MenuItem>
                )}
                {isPatient && selectedApt?.status === 'Pending' && (
                    <MenuItem onClick={() => { setEditModalOpen(true); handleMenuClose(); }} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <Edit size={16} className="text-blue-500" />
                        <span className="text-sm font-bold">{t('appt.reschedule')}</span>
                    </MenuItem>
                )}
                {((isPatient && selectedApt?.status === 'Pending') ||
                  (isDoctor && ['Confirmed', 'In Progress'].includes(selectedApt?.status)) ||
                  (isStaff && ['Pending', 'Confirmed', 'In Progress'].includes(selectedApt?.status))) && (
                    <MenuItem onClick={() => handleUpdateStatus('Cancelled')} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <XCircle size={16} className="text-red-500" />
                        <span className="text-sm font-bold text-red-600">{t('appt.cancel')}</span>
                    </MenuItem>
                )}
                {isStaff && (
                    <MenuItem onClick={() => navigate(`/emr?patientId=${selectedApt?.patientId}`)} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <FileText size={16} className="text-blue-500" />
                        <span className="text-sm font-bold">{t('appt.viewEMR')}</span>
                    </MenuItem>
                )}
                {role === 'Admin' && (
                    <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <Trash2 size={16} className="text-red-600" />
                        <span className="text-sm font-bold text-red-600">{t('appt.delete')}</span>
                    </MenuItem>
                )}
            </Menu>

            {/* ── Modals ── */}
            <BookAppointmentModal
                open={bookModalOpen}
                onClose={() => setBookModalOpen(false)}
                onSuccess={fetchAppointments}
            />

            <EditAppointmentModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                appointment={selectedApt}
                onSuccess={fetchAppointments}
            />
            </div>
        </Box>
    );
}
