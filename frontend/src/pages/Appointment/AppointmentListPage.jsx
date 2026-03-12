import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, Filter, Plus, Search,
    MoreHorizontal, CheckCircle, XCircle,
    AlertCircle, User, Stethoscope as DoctorIcon,
    Trash2, Edit
} from 'lucide-react';
import {
    Typography, Button, Card, CardContent, InputBase,
    Avatar, Chip, IconButton, Menu, MenuItem,
    CircularProgress, Alert, Tabs, Tab, Box
} from '@mui/material';
import appointmentService from '../../api/appointment.service';
import BookAppointmentModal from '../../components/appointments/BookAppointmentModal';
import EditAppointmentModal from '../../components/appointments/EditAppointmentModal';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

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
    const urlPatientId = searchParams.get('patientId');
    const urlStatus = searchParams.get('status');

    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';
    const isStaff = ['Admin', 'Receptionist'].includes(role);

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(urlPatientId || '');
    const [tabValue, setTabValue] = useState(0);

    // Modal state
    const [bookModalOpen, setBookModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedApt, setSelectedApt] = useState(null);

    useEffect(() => {
        if (urlStatus) {
            const statusMap = { 'Pending': 0, 'Confirmed': 1, 'In Progress': 2, 'Completed': 3, 'Cancelled': 4 };
            if (statusMap[urlStatus] !== undefined) setTabValue(statusMap[urlStatus]);
        }
        fetchAppointments();
    }, [urlStatus]);

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
            await appointmentService.updateStatus(selectedApt.id, newStatus);
            setAppointments(prev => prev.map(a =>
                a.id === selectedApt.id ? { ...a, status: newStatus } : a
            ));
            handleMenuClose();
            alert(`Appointment marked as ${newStatus} successfully!`);
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleApprove = async () => {
        if (!selectedApt) return;
        try {
            await appointmentService.approveAppointment(selectedApt.id);
            setAppointments(prev => prev.map(a =>
                a.id === selectedApt.id ? { ...a, isAdminApproved: true } : a
            ));
            handleMenuClose();
            alert('Appointment approved successfully!');
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
            a.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.doctorId?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (tabValue === 0) return a.status === 'Pending' && matchesSearch;
        if (tabValue === 1) return a.status === 'Confirmed' && matchesSearch;
        if (tabValue === 2) return a.status === 'In Progress' && matchesSearch;
        if (tabValue === 3) return a.status === 'Completed' && matchesSearch;
        if (tabValue === 4) return a.status === 'Cancelled' && matchesSearch;
        return matchesSearch;
    });

    const getStatusChip = (apt) => {
        const { status, isAdminApproved } = apt;
        const configs = {
            'Pending': { color: 'warning', icon: AlertCircle },
            'Confirmed': { color: 'info', icon: CheckCircle },
            'In Progress': { color: 'primary', icon: DoctorIcon },
            'Completed': { color: 'success', icon: CheckCircle },
            'Cancelled': { color: 'error', icon: XCircle },
        };
        const config = configs[status] || configs.Pending;

        let label = status;
        if (status === 'Pending' && isStaff) {
            label = isAdminApproved ? 'Pending (Approved)' : 'Pending (Review Required)';
        }

        return (
            <Chip
                label={label}
                color={config.color}
                size="small"
                variant={status === 'Pending' && !isAdminApproved ? 'filled' : 'outlined'}
                icon={<config.icon size={14} />}
                sx={{ fontWeight: 700, borderRadius: 2 }}
            />
        );
    };

    return (
        <div className="flex flex-col gap-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Typography variant="h5" fontWeight={800} color="text.primary">
                        {role === 'Patient' ? 'My Appointments' : 'Clinic Schedule'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {isStaff ? 'Manage and monitor all clinic visits' : 'View and track your dental visits'}
                    </Typography>
                </div>
                {(role === 'Patient' || isStaff) && (
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
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 100 },
                                '& .Mui-selected': { color: '#2563eb' }
                            }}
                        >
                            <Tab label="Pending" />
                            <Tab label="Confirmed" />
                            <Tab label="In Progress" />
                            <Tab label="Completed" />
                            <Tab label="Cancelled" />
                        </Tabs>

                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-1.5 border border-slate-100 focus-within:border-blue-500 focus-within:bg-white transition-all w-full md:w-80">
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
                                                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                                                        {apt.reason}
                                                    </Typography>
                                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                                        <div className="flex items-center gap-1.5 text-slate-500">
                                                            <User size={14} />
                                                            <Typography variant="caption">Patient Name: {apt.patientName || 'Guest'}</Typography>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-slate-500">
                                                            <DoctorIcon size={14} />
                                                            <Typography variant="caption">Doctor ID: {apt.doctorId.slice(0, 8)}</Typography>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-3">
                                                    {getStatusChip(apt)}
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
                PaperProps={{
                    sx: { borderRadius: 3, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', mt: 1 }
                }}
            >
                {selectedApt?.status === 'Pending' && isStaff && !selectedApt?.isAdminApproved && (
                    <MenuItem onClick={handleApprove} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <CheckCircle size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Approve Booking</span>
                    </MenuItem>
                )}
                {selectedApt?.status === 'Pending' && isStaff && (
                    <MenuItem onClick={() => handleUpdateStatus('Confirmed')} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-sm font-medium">Confirm Booking</span>
                    </MenuItem>
                )}
                {selectedApt?.status === 'Confirmed' && role === 'Doctor' && (
                    <MenuItem
                        onClick={() => {
                            handleUpdateStatus('In Progress');
                            navigate(`/emr?patientId=${selectedApt.patientId}`);
                        }}
                        sx={{ gap: 1.5, py: 1.2, px: 2 }}
                    >
                        <DoctorIcon size={16} className="text-primary-main" />
                        <span className="text-sm font-medium">Start Consultation</span>
                    </MenuItem>
                )}
                {selectedApt?.status === 'In Progress' && role === 'Doctor' && (
                    <MenuItem onClick={() => handleUpdateStatus('Completed')} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <CheckCircle size={16} className="text-blue-500" />
                        <span className="text-sm font-medium">Complete & Mark Done</span>
                    </MenuItem>
                )}
                {['Pending', 'Confirmed', 'In Progress'].includes(selectedApt?.status) && (
                    <MenuItem onClick={() => handleUpdateStatus('Cancelled')} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <XCircle size={16} className="text-red-500" />
                        <span className="text-sm font-medium">Cancel Appointment</span>
                    </MenuItem>
                )}

                <MenuItem onClick={() => { setEditModalOpen(true); handleMenuClose(); }} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                    <Edit size={16} className="text-blue-500" />
                    <span className="text-sm font-medium">Edit / Reschedule</span>
                </MenuItem>

                {role === 'Admin' && (
                    <MenuItem onClick={() => navigate(`/emr?patientId=${selectedApt.patientId}`)} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <FileIcon size={16} className="text-blue-500" />
                        <span className="text-sm font-medium">View Medical Records</span>
                    </MenuItem>
                )}

                {role === 'Admin' && (
                    <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <Trash2 size={16} className="text-red-600" />
                        <span className="text-sm font-medium text-red-600">Delete Permanently</span>
                    </MenuItem>
                )}
                <MenuItem onClick={handleMenuClose} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                    <FileIcon size={16} className="text-slate-400" />
                    <span className="text-sm font-medium">View Details</span>
                </MenuItem>
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
    );
}

const FileIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>;
