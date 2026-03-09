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
    FormControl, InputLabel, Select
} from '@mui/material';
import doctorService from '../../api/doctor.service';
import authService from '../../api/auth.service';
import { useSelector } from 'react-redux';

export default function DoctorListPage() {
    const { user } = useSelector((s) => s.auth);
    const isAdmin = user?.role === 'Admin';

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
        qualification: '', bio: '', consultationFee: ''
    });
    const [submitting, setSubmitting] = useState(false);

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
            setError('Failed to load doctors. Please ensure the doctor-service is running.');
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
            qualification: '', bio: '', consultationFee: ''
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

                // 2. Create Doctor Profile with returned userId
                await doctorService.createDoctor({
                    ...formData,
                    userId: authUser.user.id
                });
                alert('Doctor account and profile created successfully!');
            } else {
                await doctorService.updateDoctor(selectedDoctor.id, formData);
                alert('Doctor profile updated successfully!');
            }
            handleCloseModal();
            fetchDoctors();
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed');
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
            alert('Failed to update status');
        }
    };

    const handleDelete = async () => {
        if (!selectedDoctor || !window.confirm('Are you sure you want to delete this profile?')) return;
        try {
            await doctorService.deleteDoctor(selectedDoctor.id);
            setDoctors(prev => prev.filter(d => d.id !== selectedDoctor.id));
            handleMenuClose();
        } catch (err) {
            alert('Failed to delete doctor');
        }
    };

    const filteredDoctors = doctors.filter(d =>
        (d.fullName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.specialization?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex flex-col gap-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Typography variant="h5" fontWeight={800} color="text.primary">Doctors</Typography>
                    <Typography variant="body2" color="text.secondary">Manage your clinic's medical professionals</Typography>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDoctors.map((doctor) => (
                        <Card
                            key={doctor.id}
                            elevation={0}
                            sx={{
                                border: '1px solid #e2e8f0',
                                borderRadius: 5,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 20px -8px rgba(0,0,0,0.08)'
                                }
                            }}
                        >
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <Avatar
                                        src={doctor.profilePhoto}
                                        sx={{ width: 64, height: 64, borderRadius: 4, bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 800 }}
                                    >
                                        {doctor.fullName?.split(' ').map(n => n[0]).join('')}
                                    </Avatar>
                                    <div className="flex flex-col items-end gap-2">
                                        <Chip
                                            label={doctor.isActive ? 'Active' : 'Inactive'}
                                            size="small"
                                            color={doctor.isActive ? 'success' : 'default'}
                                            sx={{ fontWeight: 600, fontSize: '0.65rem' }}
                                        />
                                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, doctor)}>
                                            <MoreHorizontal size={18} />
                                        </IconButton>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <Typography variant="h6" fontWeight={700} className="truncate">
                                        {doctor.fullName}
                                    </Typography>
                                    <div className="flex items-center gap-1.5 text-blue-600 mt-0.5">
                                        <Briefcase size={14} />
                                        <Typography variant="caption" fontWeight={600}>
                                            {doctor.specialization}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Mail size={14} />
                                        <Typography variant="caption" className="truncate">{doctor.email}</Typography>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Phone size={14} />
                                        <Typography variant="caption">{doctor.phone || 'No phone'}</Typography>
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
                PaperProps={{ sx: { borderRadius: 5, mt: 10 } }}
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
                                    <TextField
                                        label="Full Name"
                                        name="fullName"
                                        fullWidth
                                        required
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        fullWidth
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                {formMode === 'add' && (
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            label="Password"
                                            name="password"
                                            type="password"
                                            fullWidth
                                            required
                                            placeholder="Set password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                        />
                                    </Grid>
                                )}
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Phone Number"
                                        name="phone"
                                        fullWidth
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Specialization"
                                        name="specialization"
                                        fullWidth
                                        required
                                        placeholder="e.g. Orthodontist"
                                        value={formData.specialization}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="License Number"
                                        name="licenseNumber"
                                        fullWidth
                                        required
                                        value={formData.licenseNumber}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Experience (Years)"
                                        name="experience"
                                        type="number"
                                        fullWidth
                                        value={formData.experience}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Qualification"
                                        name="qualification"
                                        fullWidth
                                        value={formData.qualification}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Consultation Fee"
                                        name="consultationFee"
                                        type="number"
                                        fullWidth
                                        value={formData.consultationFee}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Brief Bio"
                                        name="bio"
                                        fullWidth
                                        multiline
                                        rows={3}
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                    />
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
    );
}

// Custom Icons for UI consistency
const Stethoscope = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2h0a2 2 0 0 0-2 2v12a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h0a.3.3 0 1 0 .2.3" /><path d="M9 16V2" /><path d="M15 16V2" /><path d="M22 6h-4" /><path d="M22 10h-6" /><path d="M22 14h-4" /><path d="M20 10c0-1.1.9-2 2-2" /><path d="M20 10c0 1.1.9 2 2 2" /></svg>;
