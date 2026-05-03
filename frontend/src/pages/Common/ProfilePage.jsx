import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, Save, Key, AlertCircle, CheckCircle2, Stethoscope, Phone, Clock, DollarSign, Camera, Plus, Building2, Trash2 } from 'lucide-react';
import { Typography, Button, Card, CardContent, TextField, Grid, Avatar, Alert, CircularProgress, Box, IconButton, InputAdornment, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import authService from '../../api/auth.service';
import doctorService from '../../api/doctor.service';
import hospitalService from '../../api/hospital.service';
import { getDoctorPhotoUrl, getAuthPhotoUrl } from '../../utils/cn';
import { updateUser, logout } from '../../store/slices/authSlice';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function ProfilePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const isDoctor = user?.role === 'Doctor';

    const [loading, setLoading] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [doctorSaving, setDoctorSaving] = useState(false);
    const [doctorLoading, setDoctorLoading] = useState(false);
    const [hospitals, setHospitals] = useState([]);
    const [hospitalSelectionOpen, setHospitalSelectionOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [showPasswords, setShowPasswords] = useState(false);

    const [profileData, setProfileData] = useState({ fullName: user?.fullName || '' });

    const [doctorForm, setDoctorForm] = useState({
        phone: '', bio: '', workingHoursStart: '', workingHoursEnd: '', consultationFee: '',
        videoFee: '', slotDuration: 30, breakStart: '', breakEnd: '',
        workingDays: [], serviceTypes: ['clinic', 'video'],
        hospitals: [],
    });

    const [passwords, setPasswords] = useState({
        oldPassword: '', newPassword: '', confirmPassword: ''
    });

    useEffect(() => {
        if (user) setProfileData({ fullName: user.fullName });
        if (isDoctor) {
            setDoctorLoading(true);
            fetchHospitals();
            doctorService.getMyProfile()
                .then(data => {
                    const p = data?.doctor || data;
                    setDoctorProfile(p);
                    setDoctorForm({
                        phone: p?.phone || '',
                        bio: p?.bio || '',
                        workingHoursStart: p?.workingHoursStart || '',
                        workingHoursEnd: p?.workingHoursEnd || '',
                        consultationFee: p?.consultationFee || '',
                        videoFee: p?.videoFee || '',
                        slotDuration: p?.slotDuration || 30,
                        breakStart: p?.breakStart || '',
                        breakEnd: p?.breakEnd || '',
                        workingDays: Array.isArray(p?.workingDays) ? p.workingDays : (p?.workingDays ? JSON.parse(p.workingDays) : []),
                        serviceTypes: Array.isArray(p?.serviceTypes) ? p.serviceTypes : (p?.serviceTypes ? JSON.parse(p.serviceTypes) : ['clinic', 'video']),
                        hospitals: Array.isArray(p?.hospitals) ? p.hospitals : (p?.hospitals ? JSON.parse(p.hospitals) : []),
                    });
                })
                .catch(() => {})
                .finally(() => setDoctorLoading(false));
        }
    }, [user, isDoctor]);

    const fetchHospitals = async () => {
        try {
            const data = await hospitalService.getAllHospitals();
            setHospitals(data);
        } catch (err) {
            console.error('Failed to fetch hospitals:', err);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true); setErrorMsg(''); setSuccessMsg('');
        try {
            const result = await authService.updateMe(profileData);
            if (result?.user) dispatch(updateUser(result.user));
            setSuccessMsg('Name updated successfully!');
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to update');
        } finally { setLoading(false); }
    };

    const handleUpdateDoctorProfile = async (e) => {
        e.preventDefault();
        if (!doctorProfile?.id) return;
        setDoctorSaving(true); setErrorMsg(''); setSuccessMsg('');
        try {
            const fd = new FormData();
            Object.entries(doctorForm).forEach(([k, v]) => {
                if (v !== '' && v !== null && v !== undefined) {
                    fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v);
                }
            });
            await doctorService.updateDoctor(doctorProfile.id, fd);
            setSuccessMsg('Clinical profile updated!');
            const updated = await doctorService.getMyProfile();
            setDoctorProfile(updated?.doctor || updated);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to update clinical profile');
        } finally { setDoctorSaving(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setErrorMsg('Passwords do not match'); return;
        }
        setLoading(true); setErrorMsg(''); setSuccessMsg('');
        try {
            await authService.changePassword({ oldPassword: passwords.oldPassword, newPassword: passwords.newPassword });
            setSuccessMsg('Password changed!');
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to change password');
        } finally { setLoading(false); }
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPhotoLoading(true);
        setErrorMsg('');
        try {
            const formData = new FormData();
            formData.append('profilePhoto', file);
            const result = await authService.updateMe(formData);
            if (result?.user?.profilePhoto) {
                dispatch(updateUser({ profilePhoto: result.user.profilePhoto }));
            }
            setSuccessMsg('Profile photo updated successfully!');
        } catch (err) {
            setErrorMsg('Failed to upload photo. Please try a JPEG or PNG under 5MB.');
        } finally {
            setPhotoLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) return;
        setDeleteLoading(true);
        try {
            await authService.deleteAccount(deletePassword);
            dispatch(logout());
            navigate('/login?account=deleted');
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to delete account. Check your password.');
            setDeleteDialogOpen(false);
        } finally {
            setDeleteLoading(false);
            setDeletePassword('');
        }
    };

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 32 }}>
            <div className="flex flex-col gap-6">
            <div>
                <Typography variant="h5" fontWeight={900} color="text.primary">My Account</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                    Manage your personal information and security settings
                </Typography>
            </div>

            {(successMsg || errorMsg) && (
                <Alert severity={successMsg ? 'success' : 'error'}
                    icon={successMsg ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    sx={{ borderRadius: 4 }}>
                    {successMsg || errorMsg}
                </Alert>
            )}

            <Grid container spacing={4}>
                {/* ── Avatar sidebar ── */}
                <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ 
                        background: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)', 
                        borderRadius: 3 
                    }}>
                        <CardContent className="p-8 flex flex-col items-center text-center">
                            <Box sx={{ position: 'relative' }}>
                                <Avatar 
                                    src={isDoctor ? getDoctorPhotoUrl(doctorProfile?.profilePhoto) : getAuthPhotoUrl(user?.profilePhoto)}
                                    sx={{ 
                                        width: 120, 
                                        height: 120, 
                                        mb: 3, 
                                        bgcolor: '#eff6ff', 
                                        color: '#3b82f6', 
                                        fontWeight: 900, 
                                        fontSize: '2.5rem',
                                        boxShadow: '0 0 0 8px #f8fafc',
                                        border: '4px solid white'
                                    }}
                                >
                                    {user?.fullName?.charAt(0)}
                                </Avatar>
                                {photoLoading && (
                                    <CircularProgress 
                                        size={120} 
                                        sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1, color: 'primary.main' }} 
                                    />
                                )}
                                <input
                                    type="file"
                                    id="photo-upload"
                                    hidden
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                />
                                <label htmlFor="photo-upload">
                                    <Tooltip title="Update Photo">
                                        <IconButton
                                            component="span"
                                            sx={{
                                                position: 'absolute',
                                                bottom: 24,
                                                right: 0,
                                                bgcolor: 'white',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                '&:hover': { bgcolor: '#f8fafc' }
                                            }}
                                            size="small"
                                        >
                                            <Camera size={16} className="text-blue-600" />
                                        </IconButton>
                                    </Tooltip>
                                </label>
                            </Box>
                            
                            <Typography variant="h6" fontWeight={900} sx={{ mt: 1 }}>{user?.fullName}</Typography>
                            
                            {/* Repetition Fix: Only show badge if Name != Role (e.g. not "Admin Admin") */}
                            {user?.fullName?.toLowerCase() !== user?.role?.toLowerCase() && (
                                <Typography variant="body2" color="primary.main" fontWeight={800}
                                    sx={{ mt: 1, px: 2, py: 0.5, bgcolor: '#eff6ff', borderRadius: 2, textTransform: 'uppercase', fontSize: '0.7rem', display: 'inline-block' }}>
                                    {user?.role}
                                </Typography>
                            )}

                            {isDoctor && doctorProfile?.specialization && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontWeight: 700 }}>
                                    {doctorProfile.specialization}
                                </Typography>
                            )}
                            <div className="flex flex-col gap-2 text-left w-full mt-5">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Mail size={14} /><Typography variant="caption">{user?.email}</Typography>
                                </div>
                                {isDoctor && doctorProfile?.phone && (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Phone size={14} /><Typography variant="caption">{doctorProfile.phone}</Typography>
                                    </div>
                                )}
                                {isDoctor && doctorProfile?.consultationFee && (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <DollarSign size={14} /><Typography variant="caption">ETB {doctorProfile.consultationFee} / session</Typography>
                                    </div>
                                )}
                                {isDoctor && doctorProfile?.workingHoursStart && (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Clock size={14} /><Typography variant="caption">{doctorProfile.workingHoursStart} – {doctorProfile.workingHoursEnd}</Typography>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Shield size={14} /><Typography variant="caption">Account: Active</Typography>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Grid>

                {/* ── Forms ── */}
                <Grid item xs={12} md={8}>
                    <div className="flex flex-col gap-5">

                        {/* Account Details */}
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-5 pl-1">
                                    <User size={20} className="text-blue-600" />
                                    <Typography variant="h6" fontWeight={800}>Account Details</Typography>
                                </div>
                                <form onSubmit={handleUpdateProfile}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <Box sx={{ mb: 0.75 }}>
                                                <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Full Name</Typography>
                                            </Box>
                                            <TextField name="fullName" fullWidth required
                                                placeholder="Enter your full name"
                                                value={profileData.fullName}
                                                onChange={(e) => setProfileData({ fullName: e.target.value })} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Box sx={{ mb: 0.75 }}>
                                                <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Email Address</Typography>
                                            </Box>
                                            <TextField fullWidth disabled
                                                value={user?.email || ''}
                                                helperText="Email cannot be changed"
                                                sx={{ '& .MuiInputBase-root': { bgcolor: '#f8fafc' } }} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button type="submit" variant="contained" startIcon={<Save size={18} />}
                                                disabled={loading} sx={{ borderRadius: 3, px: 4 }}>
                                                Save Name
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Doctor Clinical Profile */}
                        {isDoctor && (
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-5 pl-1">
                                        <Stethoscope size={20} className="text-teal-600" />
                                        <Typography variant="h6" fontWeight={800}>Clinical Profile</Typography>
                                    </div>
                                    {doctorLoading ? <CircularProgress size={24} /> : (
                                        <form onSubmit={handleUpdateDoctorProfile}>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Specialization</Typography>
                                                    </Box>
                                                    <TextField fullWidth disabled
                                                        value={doctorProfile?.specialization || ''}
                                                        sx={{ '& .MuiInputBase-root': { bgcolor: '#f8fafc' } }} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Qualification</Typography>
                                                    </Box>
                                                    <TextField fullWidth disabled
                                                        value={doctorProfile?.qualification || ''}
                                                        sx={{ '& .MuiInputBase-root': { bgcolor: '#f8fafc' } }} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Experience (years)</Typography>
                                                    </Box>
                                                    <TextField fullWidth disabled
                                                        value={doctorProfile?.experience || ''}
                                                        sx={{ '& .MuiInputBase-root': { bgcolor: '#f8fafc' } }} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>License Number</Typography>
                                                    </Box>
                                                    <TextField fullWidth disabled
                                                        value={doctorProfile?.licenseNumber || ''}
                                                        sx={{ '& .MuiInputBase-root': { bgcolor: '#f8fafc' } }} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Phone</Typography>
                                                    </Box>
                                                    <TextField name="phone" fullWidth
                                                        placeholder="Enter phone number"
                                                        value={doctorForm.phone}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Consultation Fee (ETB)</Typography>
                                                    </Box>
                                                    <TextField name="consultationFee"
                                                        type="number" fullWidth
                                                        placeholder="e.g. 500"
                                                        value={doctorForm.consultationFee}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Video Fee (ETB)</Typography>
                                                    </Box>
                                                    <TextField name="videoFee"
                                                        type="number" fullWidth
                                                        placeholder="Leave blank to use clinic fee"
                                                        value={doctorForm.videoFee}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, videoFee: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Slot Duration (minutes)</Typography>
                                                    </Box>
                                                    <TextField name="slotDuration"
                                                        type="number" fullWidth
                                                        placeholder="30"
                                                        value={doctorForm.slotDuration}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, slotDuration: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Working Hours Start</Typography>
                                                    </Box>
                                                    <TextField name="workingHoursStart"
                                                        type="time" fullWidth
                                                        value={doctorForm.workingHoursStart}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, workingHoursStart: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Working Hours End</Typography>
                                                    </Box>
                                                    <TextField name="workingHoursEnd"
                                                        type="time" fullWidth
                                                        value={doctorForm.workingHoursEnd}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, workingHoursEnd: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Break Start</Typography>
                                                    </Box>
                                                    <TextField name="breakStart"
                                                        type="time" fullWidth
                                                        helperText="Optional lunch/break start"
                                                        value={doctorForm.breakStart}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, breakStart: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Break End</Typography>
                                                    </Box>
                                                    <TextField name="breakEnd"
                                                        type="time" fullWidth
                                                        helperText="Optional lunch/break end"
                                                        value={doctorForm.breakEnd}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, breakEnd: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Box sx={{ mb: 0.75 }}>
                                                        <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Bio</Typography>
                                                    </Box>
                                                    <TextField name="bio" fullWidth multiline rows={3}
                                                        placeholder="Write a short biography..."
                                                        value={doctorForm.bio}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Box className="flex items-center justify-between mb-2">
                                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                                                            Associated Hospitals
                                                        </Typography>
                                                        <Button 
                                                            size="small" 
                                                            startIcon={<Plus size={14} />}
                                                            onClick={() => setHospitalSelectionOpen(true)}
                                                            sx={{ borderRadius: 2 }}
                                                        >
                                                            Select Hospital
                                                        </Button>
                                                    </Box>
                                                    <div className="flex flex-wrap gap-2">
                                                        {doctorForm.hospitals.length === 0 && (
                                                            <Typography variant="caption" color="text.secondary">No hospitals added. Add at least one for clinic visits.</Typography>
                                                        )}
                                                        {doctorForm.hospitals.map((h, i) => (
                                                            <Chip 
                                                                key={i} 
                                                                label={h} 
                                                                onDelete={() => setDoctorForm({ ...doctorForm, hospitals: doctorForm.hospitals.filter((_, idx) => idx !== i) })}
                                                                sx={{ borderRadius: 2, bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 700 }}
                                                            />
                                                        ))}
                                                    </div>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 800, textTransform: 'uppercase', tracking: '0.05em' }}>
                                                        Working Days
                                                    </Typography>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => {
                                                            const selected = (doctorForm.workingDays || []).includes(day);
                                                            return (
                                                                <button key={day} type="button"
                                                                    onClick={() => {
                                                                        const curr = doctorForm.workingDays || [];
                                                                        setDoctorForm({ ...doctorForm, workingDays: selected ? curr.filter(d => d !== day) : [...curr, day] });
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${selected ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'}`}>
                                                                    {day.slice(0, 3)}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 800, textTransform: 'uppercase', tracking: '0.05em' }}>
                                                        Service Types
                                                    </Typography>
                                                    <div className="flex gap-3">
                                                        {[{val:'clinic',label:'🏥 Clinic'},{val:'video',label:'📹 Video'}].map(({val,label}) => {
                                                            const selected = (doctorForm.serviceTypes || []).includes(val);
                                                            return (
                                                                <button key={val} type="button"
                                                                    onClick={() => {
                                                                        const curr = doctorForm.serviceTypes || [];
                                                                        setDoctorForm({ ...doctorForm, serviceTypes: selected ? curr.filter(s => s !== val) : [...curr, val] });
                                                                    }}
                                                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${selected ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'}`}>
                                                                    {label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Button type="submit" variant="contained"
                                                        startIcon={<Save size={18} />} disabled={doctorSaving}
                                                        sx={{ borderRadius: 3, px: 4 }}>
                                                        {doctorSaving ? 'Saving...' : 'Save Clinical Profile'}
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Change Password */}
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-5 pl-1">
                                    <Key size={20} className="text-orange-600" />
                                    <Typography variant="h6" fontWeight={800}>Change Password</Typography>
                                </div>
                                <form onSubmit={handleChangePassword}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <Box sx={{ mb: 0.75 }}>
                                                <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Current Password</Typography>
                                            </Box>
                                            <TextField name="oldPassword"
                                                type={showPasswords ? 'text' : 'password'}
                                                placeholder="Enter current password"
                                                fullWidth required value={passwords.oldPassword}
                                                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton onClick={() => setShowPasswords(!showPasswords)}>
                                                                {showPasswords ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }} />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ mb: 0.75 }}>
                                                <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>New Password</Typography>
                                            </Box>
                                            <TextField name="newPassword"
                                                type={showPasswords ? 'text' : 'password'}
                                                placeholder="Enter new password"
                                                fullWidth required value={passwords.newPassword}
                                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ mb: 0.75 }}>
                                                <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, mb: 0.5, display: 'block' }}>Confirm New Password</Typography>
                                            </Box>
                                            <TextField name="confirmPassword"
                                                type={showPasswords ? 'text' : 'password'}
                                                placeholder="Confirm new password"
                                                fullWidth required value={passwords.confirmPassword}
                                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button type="submit" variant="outlined" color="warning"
                                                startIcon={<Lock size={18} />} disabled={loading}
                                                sx={{ borderRadius: 3, px: 4 }}>
                                                Update Password
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>

                        {/* ── Danger Zone — Delete Account ── */}
                        <Card elevation={0} sx={{ border: '1px solid #fecaca', borderRadius: 5, bgcolor: '#fff5f5' }}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-3 pl-1">
                                    <Trash2 size={20} className="text-red-600" />
                                    <Typography variant="h6" fontWeight={800} color="error.main">Danger Zone</Typography>
                                </div>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Permanently delete your account. Your personal data will be anonymized and cannot be recovered.
                                    Medical records and appointment history are retained for compliance purposes.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<Trash2 size={16} />}
                                    onClick={() => setDeleteDialogOpen(true)}
                                    sx={{ borderRadius: 3 }}
                                >
                                    Delete My Account
                                </Button>
                            </CardContent>
                        </Card>

                    </div>
                </Grid>
            </Grid>
            </div>

            {/* Delete Account Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setDeletePassword(''); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ color: 'error.main', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Trash2 size={20} /> Delete Account
                </DialogTitle>
                <DialogContent>
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        This action is <strong>irreversible</strong>. Your account will be anonymized and you will be logged out immediately.
                    </Alert>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter your password to confirm account deletion:
                    </Typography>
                    <TextField
                        type="password"
                        fullWidth
                        placeholder="Your current password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        autoFocus
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1.5 }}>
                    <Button color="inherit" onClick={() => { setDeleteDialogOpen(false); setDeletePassword(''); }}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={!deletePassword || deleteLoading}
                        onClick={handleDeleteAccount}
                        startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : <Trash2 size={16} />}
                        sx={{ borderRadius: 2 }}
                    >
                        {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Hospital Selection Dialog */}
            <Dialog open={hospitalSelectionOpen} onClose={() => setHospitalSelectionOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle>Select Associated Hospital</DialogTitle>
                <DialogContent dividers>
                    <Box className="flex flex-col gap-2">
                        {hospitals.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                No hospitals registered in the network.
                            </Typography>
                        ) : (
                            hospitals.filter(h => !doctorForm.hospitals.includes(h.name)).map((h) => (
                                <Box 
                                    key={h.id} 
                                    onClick={() => {
                                        setDoctorForm({ ...doctorForm, hospitals: [...doctorForm.hospitals, h.name] });
                                        setHospitalSelectionOpen(false);
                                    }}
                                    className="p-3 rounded-xl border border-slate-100 hover:border-teal-500 hover:bg-teal-50 cursor-pointer transition-all flex items-center gap-3"
                                >
                                    <Avatar src={getDoctorPhotoUrl(h.logo)} variant="rounded" sx={{ width: 40, height: 40 }}>
                                        <Building2 />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" fontWeight={700}>{h.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>{h.address}</Typography>
                                    </Box>
                                </Box>
                            ))
                        )}
                        {hospitals.filter(h => !doctorForm.hospitals.includes(h.name)).length === 0 && hospitals.length > 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                You have already added all available hospitals.
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setHospitalSelectionOpen(false)} color="inherit">Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
