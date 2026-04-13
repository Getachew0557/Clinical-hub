import React, { useState, useEffect } from 'react';
import {
    User, Mail, Lock, Shield,
    Save, Key, AlertCircle, CheckCircle2,
    Stethoscope, Phone, Clock, DollarSign
} from 'lucide-react';
import {
    Typography, Button, Card, CardContent,
    TextField, Grid, Avatar,
    Alert, CircularProgress, Box, IconButton, InputAdornment
} from '@mui/material';
import { useSelector } from 'react-redux';
import authService from '../../api/auth.service';
import doctorService from '../../api/doctor.service';
import { getDoctorPhotoUrl } from '../../utils/cn';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function ProfilePage() {
    const { user } = useSelector((s) => s.auth);
    const isDoctor = user?.role === 'Doctor';

    const [loading, setLoading] = useState(false);
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

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
            <div>
                <Typography variant="h5" color="text.primary">My Account</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
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
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                        <CardContent className="p-8 flex flex-col items-center text-center">
                            <Avatar src={getDoctorPhotoUrl(doctorProfile?.profilePhoto) || undefined}
                                sx={{ width: 110, height: 110, mb: 3, bgcolor: '#eff6ff', color: '#3b82f6', fontSize: '2.5rem', fontWeight: 800, boxShadow: '0 0 0 8px #f8fafc' }}>
                                {user?.fullName?.charAt(0)}
                            </Avatar>
                            <Typography variant="h6" fontWeight={800}>{user?.fullName}</Typography>
                            <Typography variant="body2" color="primary.main" fontWeight={700}
                                sx={{ mt: 1, px: 2, py: 0.5, bgcolor: '#eff6ff', borderRadius: 2 }}>
                                {user?.role}
                            </Typography>
                            {isDoctor && doctorProfile?.specialization && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
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
                                <div className="flex items-center gap-3 mb-5">
                                    <User size={20} className="text-blue-600" />
                                    <Typography variant="h6" fontWeight={800}>Account Details</Typography>
                                </div>
                                <form onSubmit={handleUpdateProfile}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <TextField label="Full Name" name="fullName" fullWidth required
                                                value={profileData.fullName}
                                                onChange={(e) => setProfileData({ fullName: e.target.value })} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField label="Email Address" fullWidth disabled
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
                                    <div className="flex items-center gap-3 mb-5">
                                        <Stethoscope size={20} className="text-teal-600" />
                                        <Typography variant="h6" fontWeight={800}>Clinical Profile</Typography>
                                    </div>
                                    {doctorLoading ? <CircularProgress size={24} /> : (
                                        <form onSubmit={handleUpdateDoctorProfile}>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField label="Specialization" fullWidth disabled
                                                        value={doctorProfile?.specialization || ''}
                                                        sx={{ '& .MuiInputBase-root': { bgcolor: '#f8fafc' } }} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField label="Qualification" fullWidth disabled
                                                        value={doctorProfile?.qualification || ''}
                                                        sx={{ '& .MuiInputBase-root': { bgcolor: '#f8fafc' } }} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField label="Experience (years)" fullWidth disabled
                                                        value={doctorProfile?.experience || ''}
                                                        sx={{ '& .MuiInputBase-root': { bgcolor: '#f8fafc' } }} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField label="License Number" fullWidth disabled
                                                        value={doctorProfile?.licenseNumber || ''}
                                                        sx={{ '& .MuiInputBase-root': { bgcolor: '#f8fafc' } }} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField label="Phone" name="phone" fullWidth
                                                        value={doctorForm.phone}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField label="Consultation Fee (ETB)" name="consultationFee"
                                                        type="number" fullWidth
                                                        value={doctorForm.consultationFee}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField label="Working Hours Start" name="workingHoursStart"
                                                        type="time" fullWidth InputLabelProps={{ shrink: true }}
                                                        value={doctorForm.workingHoursStart}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, workingHoursStart: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField label="Working Hours End" name="workingHoursEnd"
                                                        type="time" fullWidth InputLabelProps={{ shrink: true }}
                                                        value={doctorForm.workingHoursEnd}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, workingHoursEnd: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <TextField label="Bio" name="bio" fullWidth multiline rows={3}
                                                        value={doctorForm.bio}
                                                        onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })} />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700, textTransform: 'uppercase' }}>
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
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700, textTransform: 'uppercase' }}>
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
                                <div className="flex items-center gap-3 mb-5">
                                    <Key size={20} className="text-orange-600" />
                                    <Typography variant="h6" fontWeight={800}>Change Password</Typography>
                                </div>
                                <form onSubmit={handleChangePassword}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <TextField label="Current Password" name="oldPassword"
                                                type={showPasswords ? 'text' : 'password'}
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
                                            <TextField label="New Password" name="newPassword"
                                                type={showPasswords ? 'text' : 'password'}
                                                fullWidth required value={passwords.newPassword}
                                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField label="Confirm New Password" name="confirmPassword"
                                                type={showPasswords ? 'text' : 'password'}
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
    );
}
