import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, Save, Key, AlertCircle, CheckCircle2, Stethoscope, Phone, Clock, DollarSign, Camera, Plus, Building2, Trash2 } from 'lucide-react';
import { Typography, Button, Card, CardContent, TextField, Grid, Avatar, Alert, CircularProgress, Box, IconButton, InputAdornment, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Divider } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import authService from '../../api/auth.service';
import doctorService from '../../api/doctor.service';
import hospitalService from '../../api/hospital.service';
import { getDoctorPhotoUrl, getAuthPhotoUrl } from '../../utils/cn';
import { updateUser, logout } from '../../store/slices/authSlice';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function ProfilePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
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
                        workingDays: Array.isArray(p?.workingDays) ? p.workingDays : (p?.workingDays ? (() => { try { return JSON.parse(p.workingDays); } catch { return []; } })() : []),
                        serviceTypes: Array.isArray(p?.serviceTypes) ? p.serviceTypes : (p?.serviceTypes ? (() => { try { return JSON.parse(p.serviceTypes); } catch { return ['clinic', 'video']; } })() : ['clinic', 'video']),
                        hospitals: Array.isArray(p?.hospitals) ? p.hospitals : (p?.hospitals ? (() => { try { return JSON.parse(p.hospitals); } catch { return []; } })() : []),
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
            setSuccessMsg(t('common.success'));
        } catch (err) {
            setErrorMsg(err.response?.data?.message || t('common.error'));
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
            setSuccessMsg(t('common.success'));
            const updated = await doctorService.getMyProfile();
            setDoctorProfile(updated?.doctor || updated);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || t('common.error'));
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
            setSuccessMsg(t('common.success'));
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setErrorMsg(err.response?.data?.message || t('common.error'));
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
            setSuccessMsg(t('common.success'));
        } catch (err) {
            setErrorMsg(t('common.error'));
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
            setErrorMsg(err.response?.data?.message || t('common.error'));
            setDeleteDialogOpen(false);
        } finally {
            setDeleteLoading(false);
            setDeletePassword('');
        }
    };

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: 0, pb: 8 }}>
            <div className="flex flex-col gap-6">
            
            {(successMsg || errorMsg) && (
                <Alert severity={successMsg ? 'success' : 'error'}
                    icon={successMsg ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    sx={{ borderRadius: 4, mb: 2 }}>
                    {successMsg || errorMsg}
                </Alert>
            )}

            <Grid container spacing={4}>
                {/* ── Avatar sidebar ── */}
                <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ 
                        background: 'white',
                        border: '1px solid #e2e8f0', 
                        borderRadius: 4,
                        overflow: 'hidden'
                    }}>
                        <div className="h-24 bg-gradient-to-r from-teal-500 to-teal-700" />
                        <CardContent className="px-6 pb-8 flex flex-col items-center text-center -mt-12">
                            <Box sx={{ position: 'relative' }}>
                                <Avatar 
                                    src={isDoctor ? getDoctorPhotoUrl(doctorProfile?.profilePhoto) : getAuthPhotoUrl(user?.profilePhoto)}
                                    sx={{ 
                                        width: 100, 
                                        height: 100, 
                                        mb: 2, 
                                        bgcolor: '#f1f5f9', 
                                        color: '#0d9488', 
                                        fontWeight: 900, 
                                        fontSize: '2rem',
                                        border: '4px solid white',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    {user?.fullName?.charAt(0)}
                                </Avatar>
                                {photoLoading && (
                                    <CircularProgress 
                                        size={100} 
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
                                                bottom: 12,
                                                right: -4,
                                                bgcolor: 'white',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                '&:hover': { bgcolor: '#f8fafc' }
                                            }}
                                            size="small"
                                        >
                                            <Camera size={14} className="text-teal-600" />
                                        </IconButton>
                                    </Tooltip>
                                </label>
                            </Box>
                            
                            <Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>{user?.fullName}</Typography>
                            
                            <Typography variant="caption" color="primary.main" fontWeight={800}
                                sx={{ mt: 1, px: 2, py: 0.5, bgcolor: 'primary.light', color: 'primary.dark', borderRadius: 2, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                                {user?.role}
                            </Typography>

                            {isDoctor && doctorProfile?.specialization && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontWeight: 700 }}>
                                    {doctorProfile.specialization}
                                </Typography>
                            )}

                            <Divider sx={{ w: '100%', my: 3, opacity: 0.5 }} />

                            <div className="flex flex-col gap-4 text-left w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Mail size={14} />
                                    </div>
                                    <div>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', lineHeight: 1 }}>Email</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>{user?.email}</Typography>
                                    </div>
                                </div>
                                
                                {isDoctor && doctorForm.phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Phone size={14} />
                                        </div>
                                        <div>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', lineHeight: 1 }}>Phone</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>{doctorForm.phone}</Typography>
                                        </div>
                                    </div>
                                )}

                                {isDoctor && doctorForm.consultationFee && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <DollarSign size={14} />
                                        </div>
                                        <div>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', lineHeight: 1 }}>Consultation Fee</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>ETB {doctorForm.consultationFee}</Typography>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </Grid>

                {/* ── Forms ── */}
                <Grid item xs={12} md={8}>
                    <div className="flex flex-col gap-6">

                        {/* Account Details */}
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                                        <User size={20} />
                                    </div>
                                    <Typography variant="h6" fontWeight={800}>Personal Information</Typography>
                                </div>
                                <form onSubmit={handleUpdateProfile}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Full Name
                                            </Typography>
                                            <TextField name="fullName" fullWidth required
                                                placeholder="Enter your full name"
                                                value={profileData.fullName}
                                                onChange={(e) => setProfileData({ fullName: e.target.value })}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Email Address
                                            </Typography>
                                            <TextField fullWidth disabled
                                                value={user?.email || ''}
                                                helperText="Account email cannot be changed"
                                                sx={{ '& .MuiInputBase-root': { bgcolor: '#f8fafc', borderRadius: 3 } }} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button type="submit" variant="contained" startIcon={<Save size={18} />}
                                                disabled={loading} sx={{ borderRadius: 3, px: 4, height: 44 }}>
                                                Update Name
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Doctor Clinical Profile */}
                        {isDoctor && (
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                                            <Stethoscope size={20} />
                                        </div>
                                        <Typography variant="h6" fontWeight={800}>Clinical Settings</Typography>
                                    </div>
                                    {doctorLoading ? <CircularProgress size={24} /> : (
                                        <form onSubmit={handleUpdateDoctorProfile}>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</Typography>
                                                    <TextField name="phone" fullWidth
                                                        placeholder="Enter clinical phone"
                                                        value={doctorForm.phone}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consultation Fee (ETB)</Typography>
                                                    <TextField name="consultationFee"
                                                        type="number" fullWidth
                                                        placeholder="e.g. 500"
                                                        value={doctorForm.consultationFee}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Working Hours Start</Typography>
                                                    <TextField name="workingHoursStart"
                                                        type="time" fullWidth
                                                        value={doctorForm.workingHoursStart}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, workingHoursStart: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Working Hours End</Typography>
                                                    <TextField name="workingHoursEnd"
                                                        type="time" fullWidth
                                                        value={doctorForm.workingHoursEnd}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, workingHoursEnd: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Biography</Typography>
                                                    <TextField name="bio" fullWidth multiline rows={3}
                                                        placeholder="Write a professional biography..."
                                                        value={doctorForm.bio}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Button type="submit" variant="contained"
                                                        startIcon={<Save size={18} />} disabled={doctorSaving}
                                                        sx={{ borderRadius: 3, px: 4, height: 44 }}>
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
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                                        <Key size={20} />
                                    </div>
                                    <Typography variant="h6" fontWeight={800}>Security & Password</Typography>
                                </div>
                                <form onSubmit={handleChangePassword}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Password</Typography>
                                            <TextField name="oldPassword"
                                                type={showPasswords ? 'text' : 'password'}
                                                placeholder="Verification required"
                                                fullWidth required value={passwords.oldPassword}
                                                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton onClick={() => setShowPasswords(!showPasswords)} size="small">
                                                                {showPasswords ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }} />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</Typography>
                                            <TextField name="newPassword"
                                                type={showPasswords ? 'text' : 'password'}
                                                placeholder="New secure password"
                                                fullWidth required value={passwords.newPassword}
                                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password</Typography>
                                            <TextField name="confirmPassword"
                                                type={showPasswords ? 'text' : 'password'}
                                                placeholder="Repeat new password"
                                                fullWidth required value={passwords.confirmPassword}
                                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button type="submit" variant="outlined" color="warning"
                                                startIcon={<Lock size={18} />} disabled={loading}
                                                sx={{ borderRadius: 3, px: 4, height: 44 }}>
                                                Change Password
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Danger Zone */}
                        <Card elevation={0} sx={{ border: '1px solid #fee2e2', borderRadius: 4, bgcolor: '#fef2f2' }}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                                        <Trash2 size={20} />
                                    </div>
                                    <Typography variant="h6" fontWeight={800} color="error.main">Danger Zone</Typography>
                                </div>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
                                    Permanently delete your account and all associated personal data. This action is irreversible.
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="error"
                                    disableElevation
                                    startIcon={<Trash2 size={16} />}
                                    onClick={() => setDeleteDialogOpen(true)}
                                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                                >
                                    Delete My Account
                                </Button>
                            </CardContent>
                        </Card>

                    </div>
                </Grid>
            </Grid>
            </div>

            {/* Delete Account Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setDeletePassword(''); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Delete Account?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 3, fontWeight: 500 }}>
                        Are you sure you want to delete your account? This will anonymize your profile data.
                    </Typography>
                    <TextField
                        type="password"
                        fullWidth
                        placeholder="Enter password to confirm"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        disableElevation
                        onClick={handleDeleteAccount}
                        disabled={!deletePassword || deleteLoading}
                        sx={{ borderRadius: 2 }}
                    >
                        Confirm Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
