import React, { useState, useEffect } from 'react';
import {
    Search, Filter, UserPlus, Mail, Phone,
    Briefcase, MoreHorizontal, UserCheck, UserMinus,
    X, Save, FileText as FileIcon, Award, Clock
} from 'lucide-react';
import {
    Typography, Button, Card, CardContent, InputBase,
    Avatar, Chip, IconButton, Menu, MenuItem,
    CircularProgress, Alert, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid,
    FormControl, InputLabel, Select, Box
} from '@mui/material';
import doctorService from '../../api/doctor.service';
import authService from '../../api/auth.service';
import { useSelector } from 'react-redux';
import { getDoctorPhotoUrl } from '../../utils/cn';
import useSnack from '../../hooks/useSnack';
import { Snackbar, Alert as MuiAlert } from '@mui/material';

export default function DoctorListPage() {
    const { user } = useSelector((s) => s.auth);
    const isAdmin = user?.role === 'Admin';
    const { snack, showSnack, handleSnackClose } = useSnack();

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', phone: '',
        specialization: '', licenseNumber: '', experience: '',
        qualification: '', bio: '', consultationFee: '',
        clinicFee: '', videoFee: '',
        serviceTypes: ['clinic', 'video'],
        workingDays: [], workingHoursStart: '08:00', workingHoursEnd: '18:00',
        breakStart: '13:00', breakEnd: '14:00',
        maxPatientsPerHour: 10, slotDuration: 30,
        languages: 'Amharic, English'
    });
    const [submitting, setSubmitting] = useState(false);
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);

    // Menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const data = await doctorService.getAllDoctors();
            setDoctors(data.doctors || []);
            setError(null);
        } catch (err) {
            console.error('Fetch Doctors Error:', err);
            const msg = err.response?.data?.message || err.message;
            setError(`Failed to load doctors: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (mode, doctor = null) => {
        setFormMode(mode);
        if (mode === 'edit' && doctor) {
            setFormData({
                ...doctor,
                consultationFee: doctor.consultationFee || ''
            });
            setSelectedDoctor(doctor);
        } else {
            setFormData({
                fullName: '', email: '', password: '', phone: '',
                specialization: '', licenseNumber: '', experience: '',
                qualification: '', bio: '', consultationFee: ''
            });
        }
        setModalOpen(true);
        handleMenuClose();
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setFormData({
            userId: '', fullName: '', email: '', phone: '',
            specialization: '', licenseNumber: '', experience: '',
            qualification: '', bio: '', consultationFee: '',
            clinicFee: '', videoFee: '',
            serviceTypes: ['clinic', 'video'],
            workingDays: [], workingHoursStart: '08:00', workingHoursEnd: '18:00',
            breakStart: '13:00', breakEnd: '14:00',
            maxPatientsPerHour: 10, slotDuration: 30,
            languages: 'Amharic, English'
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (formMode === 'add') {
                // 1. Create Auth User
                const authUser = await authService.register({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    role: 'Doctor'
                });

                // 2. Build FormData to support photo upload
                const fd = new FormData();
                Object.entries({ ...formData, userId: authUser.user.id }).forEach(([k, v]) => {
                    if (v !== '' && v !== null && v !== undefined && k !== 'password') {
                        fd.append(k, typeof v === 'object' && !Array.isArray(v) ? JSON.stringify(v) : Array.isArray(v) ? JSON.stringify(v) : v);
                    }
                });
                if (profilePhotoFile) fd.append('profilePhoto', profilePhotoFile);

                await doctorService.createDoctor(fd);
                showSnack('Doctor account and profile created successfully!');
            } else {
                const fd = new FormData();
                Object.entries(formData).forEach(([k, v]) => {
                    if (v !== '' && v !== null && v !== undefined && k !== 'password') {
                        fd.append(k, typeof v === 'object' && !Array.isArray(v) ? JSON.stringify(v) : Array.isArray(v) ? JSON.stringify(v) : v);
                    }
                });
                if (profilePhotoFile) fd.append('profilePhoto', profilePhotoFile);
                await doctorService.updateDoctor(selectedDoctor.id, fd);
                showSnack('Doctor profile updated successfully!');
            }
            setProfilePhotoFile(null);
            handleCloseModal();
            fetchDoctors();
        } catch (err) {
            showSnack(err.response?.data?.message || 'Operation failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMenuOpen = (event, doctor) => {
        setAnchorEl(event.currentTarget);
        setSelectedDoctor(doctor);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        // Don't clear selectedDoctor yet as modal might need it
    };

    const handleToggleStatus = async () => {
        if (!selectedDoctor) return;
        try {
            const newStatus = !selectedDoctor.isActive;
            await doctorService.toggleStatus(selectedDoctor.id, newStatus);
            setDoctors(prev => prev.map(d =>
                d.id === selectedDoctor.id ? { ...d, isActive: newStatus } : d
            ));
            handleMenuClose();
        } catch (err) {
            showSnack('Failed to update status', 'error');
        }
    };

    const handleDelete = async () => {
        if (!selectedDoctor || !window.confirm('Are you sure you want to delete this profile?')) return;
        try {
            await doctorService.deleteDoctor(selectedDoctor.id);
            setDoctors(prev => prev.filter(d => d.id !== selectedDoctor.id));
            handleMenuClose();
        } catch (err) {
            showSnack('Failed to delete doctor', 'error');
        }
    };

    const filteredDoctors = doctors.filter(d =>
        (d.fullName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.specialization?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
            <div className="flex flex-col gap-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Typography variant="h5" fontWeight={700} color="text.primary">Doctors</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Manage your clinic's medical professionals
                    </Typography>
                </div>
                {isAdmin && (
                    <Button
                        variant="contained"
                        startIcon={<UserPlus size={18} />}
                        sx={{ borderRadius: 3 }}
                        onClick={() => handleOpenModal('add')}
                    >
                        Add Doctor
                    </Button>
                )}
            </div>

            {/* ── Filters & Search ── */}
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                <CardContent className="flex flex-col md:flex-row items-center gap-4 py-4 px-5">
                    <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-100 px-4 py-2 border border-slate-100 focus-within:border-blue-500 focus-within:bg-white transition-all w-full">
                        <Search size={18} className="text-slate-400" />
                        <InputBase
                            placeholder="Search by name or specialization..."
                            className="w-full text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<Filter size={18} />}
                        sx={{ borderRadius: 3, borderColor: '#e2e8f0', color: '#64748b' }}
                    >
                        Filters
                    </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDoctors.map((doctor) => (
                        <Card
                            key={doctor.id}
                            elevation={0}
                            sx={{
                                background: 'rgba(255, 255, 255, 0.7)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: 5,
                                overflow: 'hidden',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                    borderColor: 'primary.main',
                                }
                            }}
                        >
                            <CardContent className="p-0">
                                <div className="p-6 flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar
                                                src={getDoctorPhotoUrl(doctor.profilePhoto)}
                                                sx={{ 
                                                    width: 72, 
                                                    height: 72, 
                                                    borderRadius: 4, 
                                                    bgcolor: '#f0fdf4', 
                                                    color: '#16a34a', 
                                                    fontWeight: 900,
                                                    fontSize: '1.5rem',
                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                {doctor.fullName?.split(' ').map(n => n[0]).join('')}
                                            </Avatar>
                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${doctor.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                                        </div>
                                        <div>
                                            <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ lineHeight: 1.3 }}>
                                                {doctor.fullName}
                                            </Typography>
                                            <div className="flex items-center gap-1.5 text-teal-600 mt-0.5">
                                                <Briefcase size={12} />
                                                <Typography variant="caption" fontWeight={600}>
                                                    {doctor.specialization}
                                                </Typography>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${doctor.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {doctor.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                        <IconButton 
                                            size="small" 
                                            onClick={(e) => handleMenuOpen(e, doctor)}
                                            sx={{ bgcolor: 'white/50', '&:hover': { bgcolor: 'white' }, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                        >
                                            <MoreHorizontal size={18} />
                                        </IconButton>
                                    </div>
                                </div>

                                <div className="px-6 pb-6 space-y-3">
                                    <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <Mail size={13} className="text-slate-400 shrink-0" />
                                            <Typography variant="body2" className="truncate">{doctor.email}</Typography>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone size={13} className="text-slate-400 shrink-0" />
                                            <Typography variant="body2">{doctor.phone || 'No phone'}</Typography>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-1.5">
                                            <Award size={14} className="text-amber-500" />
                                            <Typography variant="caption" color="text.secondary">
                                                {doctor.experience || '0'}+ yrs exp.
                                            </Typography>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} className="text-slate-400" />
                                            <Typography variant="caption" color="text.secondary">
                                                {doctor.workingHoursStart || '08:00'} – {doctor.workingHoursEnd || '18:00'}
                                            </Typography>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!loading && !error && filteredDoctors.length === 0 && (
                <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="p-4 bg-slate-50 rounded-full">
                        <Search size={32} />
                    </div>
                    <p className="text-sm">No doctors found matching your search.</p>
                </div>
            )}

            {/* ── Add/Edit Modal ── */}
            <Dialog
                open={modalOpen}
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, mt: 4 } }}
            >
                <form onSubmit={handleSubmit}>
                    <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', p: 3 }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    {formMode === 'add' ? <UserPlus size={20} /> : <FileIcon size={20} />}
                                </div>
                                <Typography variant="h6" fontWeight={800}>
                                    {formMode === 'add' ? 'Add New Doctor' : 'Update Doctor Profile'}
                                </Typography>
                            </div>
                            <IconButton onClick={handleCloseModal} size="small">
                                <X size={20} />
                            </IconButton>
                        </div>
                    </DialogTitle>

                    <DialogContent sx={{ p: 4 }}>
                        <div className="pt-2">
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Full Name
                                        </Typography>
                                        <TextField
                                            name="fullName"
                                            fullWidth
                                            required
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Email Address
                                        </Typography>
                                        <TextField
                                            name="email"
                                            type="email"
                                            fullWidth
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                {formMode === 'add' && (
                                    <Grid item xs={12} md={4}>
                                        <Box>
                                            <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                                Password
                                            </Typography>
                                            <TextField
                                                name="password"
                                                type="password"
                                                fullWidth
                                                required
                                                placeholder="Set password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                            />
                                        </Box>
                                    </Grid>
                                )}
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Phone Number
                                        </Typography>
                                        <TextField
                                            name="phone"
                                            fullWidth
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Specialization
                                        </Typography>
                                        <TextField
                                            name="specialization"
                                            fullWidth
                                            required
                                            placeholder="e.g. Orthodontist"
                                            value={formData.specialization}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            License Number
                                        </Typography>
                                        <TextField
                                            name="licenseNumber"
                                            fullWidth
                                            required
                                            value={formData.licenseNumber}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Experience (Years)
                                        </Typography>
                                        <TextField
                                            name="experience"
                                            type="number"
                                            fullWidth
                                            value={formData.experience}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Qualification
                                        </Typography>
                                        <TextField
                                            name="qualification"
                                            fullWidth
                                            value={formData.qualification}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Consultation Fee (ETB)
                                        </Typography>
                                        <TextField
                                            name="consultationFee"
                                            type="number"
                                            fullWidth
                                            helperText="Used for clinic visits"
                                            value={formData.consultationFee}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Video Consultation Fee (ETB)
                                        </Typography>
                                        <TextField
                                            name="videoFee"
                                            type="number"
                                            fullWidth
                                            placeholder="Leave blank to use same as clinic fee"
                                            value={formData.videoFee}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Max Patients / Hour
                                        </Typography>
                                        <TextField
                                            name="maxPatientsPerHour"
                                            type="number"
                                            fullWidth
                                            value={formData.maxPatientsPerHour}
                                            onChange={handleInputChange}
                                            helperText="Default: 10 (= 5 per 30-min slot)"
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Slot Duration (minutes)
                                        </Typography>
                                        <TextField
                                            name="slotDuration"
                                            type="number"
                                            fullWidth
                                            value={formData.slotDuration}
                                            onChange={handleInputChange}
                                            helperText="Default: 30 minutes"
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Languages Spoken
                                        </Typography>
                                        <TextField
                                            name="languages"
                                            fullWidth
                                            placeholder="e.g. Amharic, English, Tigrinya"
                                            value={formData.languages}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Work Start Time
                                        </Typography>
                                        <TextField
                                            name="workingHoursStart"
                                            type="time"
                                            fullWidth
                                            value={formData.workingHoursStart}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Work End Time
                                        </Typography>
                                        <TextField
                                            name="workingHoursEnd"
                                            type="time"
                                            fullWidth
                                            value={formData.workingHoursEnd}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Break Start
                                        </Typography>
                                        <TextField
                                            name="breakStart"
                                            type="time"
                                            fullWidth
                                            value={formData.breakStart}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Break End
                                        </Typography>
                                        <TextField
                                            name="breakEnd"
                                            type="time"
                                            fullWidth
                                            value={formData.breakEnd}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                        Working Days
                                    </Typography>
                                    <div className="flex flex-wrap gap-2">
                                        {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => {
                                            const selected = (formData.workingDays || []).includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = formData.workingDays || [];
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            workingDays: selected
                                                                ? current.filter(d => d !== day)
                                                                : [...current, day]
                                                        }));
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                                        selected
                                                            ? 'bg-teal-600 text-white border-teal-600'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'
                                                    }`}
                                                >
                                                    {day.slice(0, 3)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                        Service Types Offered
                                    </Typography>
                                    <div className="flex gap-3">
                                        {[{val:'clinic',label:'🏥 Clinic Visit'},{val:'video',label:'📹 Video Consultation'}].map(({val,label}) => {
                                            const selected = (formData.serviceTypes || []).includes(val);
                                            return (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = formData.serviceTypes || [];
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            serviceTypes: selected
                                                                ? current.filter(s => s !== val)
                                                                : [...current, val]
                                                        }));
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                                                        selected
                                                            ? 'bg-teal-600 text-white border-teal-600'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                        Profile Photo
                                    </Typography>
                                    <div className="flex items-center gap-4">
                                        {(profilePhotoFile || formData.profilePhoto) && (
                                            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-teal-200 shrink-0">
                                                <img
                                                    src={profilePhotoFile ? URL.createObjectURL(profilePhotoFile) : getDoctorPhotoUrl(formData.profilePhoto)}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <label className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 border-2 border-dashed border-teal-300 rounded-xl cursor-pointer hover:bg-teal-100 transition-all text-sm font-semibold text-teal-700">
                                            <span>📷 {profilePhotoFile ? profilePhotoFile.name : 'Choose Photo'}</span>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) => setProfilePhotoFile(e.target.files[0] || null)}
                                            />
                                        </label>
                                        {profilePhotoFile && (
                                            <button type="button" onClick={() => setProfilePhotoFile(null)} className="text-red-400 hover:text-red-600 text-xs font-bold">
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                            Brief Bio
                                        </Typography>
                                        <TextField
                                            name="bio"
                                            fullWidth
                                            multiline
                                            rows={3}
                                            placeholder="Write a brief introduction..."
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </div>
                    </DialogContent>

                    <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', gap: 2 }}>
                        <Button color="inherit" onClick={handleCloseModal}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<Save size={18} />}
                            disabled={submitting}
                            sx={{ borderRadius: 3, px: 4 }}
                        >
                            {submitting ? 'Processing...' : formMode === 'add' ? 'Create Profile' : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* ── Doctor Actions Menu ── */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: { borderRadius: 3, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', mt: 1 }
                }}
            >
                <MenuItem onClick={() => handleOpenModal('edit', selectedDoctor)} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                    <FileIcon size={16} className="text-blue-500" />
                    <span className="text-sm font-medium">Edit Profile</span>
                </MenuItem>
                {isAdmin && (
                    <>
                        <MenuItem onClick={handleToggleStatus} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                            {selectedDoctor?.isActive ? (
                                <><UserMinus size={16} className="text-orange-500" /><span className="text-sm font-medium text-orange-600">Deactivate</span></>
                            ) : (
                                <><UserCheck size={16} className="text-green-500" /><span className="text-sm font-medium text-green-600">Activate</span></>
                            )}
                        </MenuItem>
                        <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                            <X size={16} className="text-red-500" />
                            <span className="text-sm font-medium text-red-600">Delete Profile</span>
                        </MenuItem>
                    </>
                )}
            </Menu>
        </div>
    </Box>
    );
}

// Custom Icons for UI consistency
const Stethoscope = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2h0a2 2 0 0 0-2 2v12a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h0a.3.3 0 1 0 .2.3" /><path d="M9 16V2" /><path d="M15 16V2" /><path d="M22 6h-4" /><path d="M22 10h-6" /><path d="M22 14h-4" /><path d="M20 10c0-1.1.9-2 2-2" /><path d="M20 10c0 1.1.9 2 2 2" /></svg>;
