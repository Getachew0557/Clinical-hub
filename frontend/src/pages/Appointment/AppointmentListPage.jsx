import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, Filter, Plus, Search,
    MoreHorizontal, CheckCircle, XCircle,
    AlertCircle, User, Stethoscope as DoctorIcon,
    Trash2, Edit, Video
} from 'lucide-react';
import {
    Typography, Button, Card, CardContent, InputBase,
    Avatar, Chip, IconButton, Menu, MenuItem,
    CircularProgress, Alert, Tabs, Tab, Box
} from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import appointmentService from '../../api/appointment.service';
import BookAppointmentModal from '../../components/appointments/BookAppointmentModal';
import EditAppointmentModal from '../../components/appointments/EditAppointmentModal';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function AppointmentListPage() {
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
    const TABS = isDoctor
        ? ['In Progress', 'Completed', 'Cancelled']           // Doctor sees actionable + cancelled
        : isPatient
            ? ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']  // Patient sees all their own
            : ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']; // Admin/Receptionist sees all

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
        // Status counts endpoint only available for staff roles — skip for Patient
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
            setError('Failed to load appointments. Please ensure the appointment-service is running.');
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
            const result = await appointmentService.updateStatus(selectedApt.id, newStatus);
            // Re-fetch to get enriched data (patientName, confirmedByName, confirmedAt)
            await fetchAppointments();
            handleMenuClose();
            fetchStatusCounts();
        } catch (err) {
            alert('Failed to update status');
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
            alert('Failed to approve appointment');
        }
    };

    const handleDelete = async () => {
        if (!selectedApt || !window.confirm('Are you sure you want to delete this appointment?')) return;
        try {
            await appointmentService.deleteAppointment(selectedApt.id);
            setAppointments(prev => prev.filter(a => a.id !== selectedApt.id));
            handleMenuClose();
            alert('Appointment deleted successfully!');
        } catch (err) {
            alert('Failed to delete appointment');
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
            'Pending':     { color: 'warning', label: isStaff ? (isAdminApproved ? 'Pending (Approved)' : 'Pending — Review') : 'Pending Approval' },
            'Confirmed':   { color: 'info',    label: type === 'video' ? '📹 Confirmed (Video)' : '🏥 Confirmed (Clinic)' },
            'In Progress': { color: 'primary', label: '🔴 In Progress' },
            'Completed':   { color: 'success', label: '✅ Completed' },
            'Cancelled':   { color: 'error',   label: '❌ Cancelled' },
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
                    <Typography variant="h5" color="text.primary">
                        {isDoctor ? 'My Consultations' : isPatient ? 'My Appointments' : 'Clinic Schedule'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        {isDoctor
                            ? 'Manage your confirmed and active consultations'
                            : isStaff
                                ? 'Manage and monitor all clinic visits'
                                : 'View and track your visits'}
                    </Typography>
                </div>
                {(isPatient || isStaff) && (
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        sx={{ borderRadius: 3 }}
                        onClick={() => setBookModalOpen(true)}
                    >
                        Book Appointment
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
                            sx={{
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 90 },
                                '& .Mui-selected': { color: '#0d9488' }
                            }}
                        >
                            {TABS.map(tab => {
                                const counts = statusCounts[tab];
                                const live = counts?.live ?? appointments.filter(a => a.status === tab).length;
                                const cumulative = counts?.cumulative;
                                return (
                                    <Tab
                                        key={tab}
                                        label={
                                            <span className="flex flex-col items-center gap-0.5">
                                                <span>{tab}</span>
                                                <span className="flex items-center gap-1 text-xs font-normal">
                                                    <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-bold">{live}</span>
                                                    {cumulative !== undefined && cumulative !== live && (
                                                        <span className="text-slate-400">/ {cumulative} total</span>
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
                                placeholder="Search appointments..."
                                className="w-full text-sm"
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
                                    '&:hover': { border: '1px solid #94a3b8' }
                                }}
                            >
                                <CardContent className="p-5">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        {/* Date/Time Block */}
                                        <div className="flex flex-row md:flex-col items-center justify-center md:w-24 gap-1 md:bg-blue-50/50 rounded-2xl p-3">
                                            <Typography variant="h6" fontWeight={800} color="primary.main">
                                                {apt.appointmentDate ? apt.appointmentDate.split('-')[2] : '--'}
                                            </Typography>
                                            <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase' }}>
                                                {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleString('default', { month: 'short' }) : '---'}
                                            </Typography>
                                            <div className="flex items-center gap-1 text-slate-500 ml-4 md:ml-0 md:mt-2">
                                                <Clock size={12} />
                                                <Typography variant="caption" fontWeight={600}>
                                                    {apt.appointmentTime ? apt.appointmentTime.slice(0, 5) : '--:--'}
                                                </Typography>
                                            </div>
                                        </div>

                                        {/* Info Block */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Typography variant="subtitle2" color="text.primary">
                                                            {apt.reason}
                                                        </Typography>
                                                        {apt.type === 'video' && (
                                                            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-extrabold rounded-full border border-teal-100 flex items-center gap-1">
                                                                <Video size={10} /> Video
                                                            </span>
                                                        )}
                                                        {apt.type === 'clinic' && (
                                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-extrabold rounded-full border border-amber-100">
                                                                🏥 Clinic
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 mt-1">
                                                        {/* Show patient name for Doctor/Admin/Receptionist */}
                                                        {!isPatient && (
                                                            <div className="flex items-start gap-1.5 text-slate-500">
                                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-xs shrink-0 mt-0.5">
                                                                    {(apt.patientName || apt.patientDetails?.fullName || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <Typography variant="caption" fontWeight={700} color="text.primary">
                                                                        {apt.patientName || apt.patientDetails?.fullName || `Patient #${apt.patientId?.slice(-6)?.toUpperCase()}`}
                                                                    </Typography>
                                                                    <span className="text-xs text-slate-400">
                                                                        ID: #{apt.patientId?.slice(-6)}
                                                                        {apt.patientDetails?.phone && ` · ${apt.patientDetails.phone}`}
                                                                        {apt.patientDetails?.email && ` · ${apt.patientDetails.email}`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Show doctor name for Patient */}
                                                        {isPatient && (
                                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                                <DoctorIcon size={13} />
                                                                <Typography variant="caption">Dr. {apt.doctorName || 'Doctor'}</Typography>
                                                            </div>
                                                        )}
                                                        {/* Show doctor name for Admin/Receptionist */}
                                                        {isStaff && apt.doctorName && (
                                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                                <DoctorIcon size={13} />
                                                                <Typography variant="caption">Dr. {apt.doctorName}</Typography>
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
                                                        <span className="text-xs text-amber-600 font-bold">Awaiting clinic approval</span>
                                                    )}
                                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, apt)}>
                                                        <MoreHorizontal size={18} />
                                                    </IconButton>
                                                </div>
                                            </div>

                                            {apt.notes && (
                                                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>
                                                        CLINICAL NOTES:
                                                    </Typography>
                                                    <Typography variant="caption" color="text.primary">
                                                        {apt.notes}
                                                    </Typography>
                                                </div>
                                            )}

                                            {/* Confirmed by / confirmed at */}
                                            {['Confirmed', 'In Progress', 'Completed'].includes(apt.status) && apt.confirmedAt && (
                                                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                                                    <CheckCircle size={13} className="text-blue-500 shrink-0" />
                                                    <div>
                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4ed8', display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            Confirmed by
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 600 }}>
                                                            {apt.confirmedByName || 'Staff'}
                                                            <span style={{ color: '#93c5fd', fontWeight: 400, marginLeft: 6 }}>
                                                                · {new Date(apt.confirmedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                {' '}{new Date(apt.confirmedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
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
                            <Calendar size={32} />
                            <p className="text-sm">No appointments found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Actions Menu ── */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', mt: 1 } }}
            >
                {/* Admin/Receptionist: Approve pending */}
                {selectedApt?.status === 'Pending' && isStaff && !selectedApt?.isAdminApproved && (
                    <MenuItem onClick={handleApprove} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <CheckCircle size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Approve Booking</span>
                    </MenuItem>
                )}
                {/* Admin/Receptionist: Confirm */}
                {selectedApt?.status === 'Pending' && isStaff && (
                    <MenuItem onClick={() => handleUpdateStatus('Confirmed')} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-sm font-medium">Confirm Booking</span>
                    </MenuItem>
                )}
                {/* Doctor: Start consultation (Confirmed → In Progress) */}
                {selectedApt?.status === 'Confirmed' && isDoctor && (
                    <MenuItem
                        onClick={() => { handleUpdateStatus('In Progress'); handleMenuClose(); }}
                        sx={{ gap: 1.5, py: 1.2, px: 2 }}
                    >
                        <DoctorIcon size={16} className="text-teal-600" />
                        <span className="text-sm font-medium text-teal-700">Start Consultation</span>
                    </MenuItem>
                )}
                {/* Doctor: Complete (In Progress → Completed) */}
                {selectedApt?.status === 'In Progress' && isDoctor && (
                    <MenuItem onClick={() => handleUpdateStatus('Completed')} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <CheckCircle size={16} className="text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-700">Mark as Completed</span>
                    </MenuItem>
                )}
                {/* Doctor: Add/edit notes */}
                {isDoctor && (
                    <MenuItem onClick={() => navigate(`/emr?patientId=${selectedApt?.patientId}`)} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <FileIcon size={16} className="text-blue-500" />
                        <span className="text-sm font-medium">View / Add Notes (EMR)</span>
                    </MenuItem>
                )}
                {/* Patient: Reschedule pending */}
                {isPatient && selectedApt?.status === 'Pending' && (
                    <MenuItem onClick={() => { setEditModalOpen(true); handleMenuClose(); }} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <Edit size={16} className="text-blue-500" />
                        <span className="text-sm font-medium">Reschedule</span>
                    </MenuItem>
                )}
                {/* Cancel — Patient (Pending only), Staff (any active) */}
                {((isPatient && selectedApt?.status === 'Pending') ||
                  (isStaff && ['Pending', 'Confirmed', 'In Progress'].includes(selectedApt?.status))) && (
                    <MenuItem onClick={() => handleUpdateStatus('Cancelled')} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <XCircle size={16} className="text-red-500" />
                        <span className="text-sm font-medium text-red-600">Cancel Appointment</span>
                    </MenuItem>
                )}
                {/* Admin: View EMR */}
                {isStaff && (
                    <MenuItem onClick={() => navigate(`/emr?patientId=${selectedApt?.patientId}`)} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <FileIcon size={16} className="text-blue-500" />
                        <span className="text-sm font-medium">View Medical Records</span>
                    </MenuItem>
                )}
                {/* Admin only: Delete */}
                {role === 'Admin' && (
                    <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <Trash2 size={16} className="text-red-600" />
                        <span className="text-sm font-medium text-red-600">Delete Permanently</span>
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
        </div >
    </Box>
    );
}

const FileIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>;
