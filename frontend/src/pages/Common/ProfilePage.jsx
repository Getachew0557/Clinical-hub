import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, Save, Key, AlertCircle, CheckCircle2, Stethoscope, Phone, Clock, DollarSign, Camera } from 'lucide-react';
import { Typography, Button, Card, CardContent, TextField, Grid, Avatar, Alert, CircularProgress, Box, IconButton, InputAdornment, Tooltip } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import authService from '../../api/auth.service';
import doctorService from '../../api/doctor.service';
import { getDoctorPhotoUrl, getAuthPhotoUrl } from '../../utils/cn';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function ProfilePage() {
    const dispatch = useDispatch();
    const { user } = useSelector((s) => s.auth);
    const isDoctor = user?.role === 'Doctor';

    const [loading, setLoading] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [doctorSaving, setDoctorSaving] = useState(false);
    const [doctorLoading, setDoctorLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [showPasswords, setShowPasswords] = useState(false);

    const [profileData, setProfileData] = useState({ fullName: user?.fullName || '' });

    const [doctorForm, setDoctorForm] = useState({
        phone: '', bio: '', workingHoursStart: '', workingHoursEnd: '', consultationFee: '',
        workingDays: [], serviceTypes: ['clinic', 'video'],
    });

    const [passwords, setPasswords] = useState({
        oldPassword: '', newPassword: '', confirmPassword: ''
    });

    useEffect(() => {
        if (user) setProfileData({ fullName: user.fullName });
        if (isDoctor) {
            setDoctorLoading(true);
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
                        workingDays: Array.isArray(p?.workingDays) ? p.workingDays : (p?.workingDays ? JSON.parse(p.workingDays) : []),
                        serviceTypes: Array.isArray(p?.serviceTypes) ? p.serviceTypes : (p?.serviceTypes ? JSON.parse(p.serviceTypes) : ['clinic', 'video']),
                    });
                })
                .catch(() => {})
                .finally(() => setDoctorLoading(false));
        }
    }, [user, isDoctor]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true); setErrorMsg(''); setSuccessMsg('');
        try {
            await authService.updateMe(profileData);
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
            await authService.updateMe(formData);
            setSuccessMsg('Profile photo updated successfully!');
            // Page will re-render as authService.updateMe updates localStorage which redux should pick up 
            // depending on implementation, but standard here is manual refresh or redux dispatch.
            // For now, let's assume updateMe updates the local user object.
            setTimeout(() => window.location.reload(), 1000); 
        } catch (err) {
            setErrorMsg('Failed to upload photo');
        } finally {
            setPhotoLoading(false);
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

                    </div>
                </Grid>
            </Grid>
            </div>
        </Box>
    );
}
