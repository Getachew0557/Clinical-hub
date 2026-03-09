import React, { useState, useEffect } from 'react';
import {
    User, Mail, Lock, Shield,
    Save, Key, AlertCircle, CheckCircle2
} from 'lucide-react';
import {
    Typography, Button, Card, CardContent,
    TextField, Grid, Avatar, Divider,
    Alert, CircularProgress, Box, IconButton, InputAdornment
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import authService from '../../api/auth.service';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function ProfilePage() {
    const { user } = useSelector((s) => s.auth);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Profile form
    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
    });

    // Password form
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({
                fullName: user.fullName,
                email: user.email
            });
        }
    }, [user]);

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await authService.updateMe(profileData);
            setSuccessMsg('Profile updated successfully!');
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setErrorMsg('New passwords do not match');
            return;
        }
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await authService.changePassword({
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            });
            setSuccessMsg('Password changed successfully!');
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
            <div>
                <Typography variant="h4" fontWeight={800} color="text.primary">My Account</Typography>
                <Typography variant="body1" color="text.secondary">Manage your personal information and security settings</Typography>
            </div>

            {(successMsg || errorMsg) && (
                <Alert
                    severity={successMsg ? "success" : "error"}
                    icon={successMsg ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    sx={{ borderRadius: 4 }}
                >
                    {successMsg || errorMsg}
                </Alert>
            )}

            <Grid container spacing={4}>
                {/* ── Personal Information ── */}
                <Grid item xs={12} md={5}>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5, height: '100%' }}>
                        <CardContent className="p-8 flex flex-col items-center text-center h-full">
                            <Avatar
                                sx={{
                                    width: 120, height: 120, mb: 3,
                                    bgcolor: '#eff6ff', color: '#3b82f6',
                                    fontSize: '3rem', fontWeight: 800,
                                    boxShadow: '0 0 0 8px #f8fafc'
                                }}
                            >
                                {user?.fullName?.charAt(0)}
                            </Avatar>
                            <Typography variant="h5" fontWeight={800}>{user?.fullName}</Typography>
                            <Typography variant="body2" color="primary.main" fontWeight={700} sx={{ mt: 1, px: 2, py: 0.5, bgcolor: '#eff6ff', borderRadius: 2 }}>
                                {user?.role}
                            </Typography>

                            <Box sx={{ mt: 'auto', pt: 6, width: '100%' }}>
                                <div className="flex flex-col gap-4 text-left">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Mail size={18} />
                                        <Typography variant="body2">{user?.email}</Typography>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Shield size={18} />
                                        <Typography variant="body2">Account status: Active</Typography>
                                    </div>
                                </div>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={7}>
                    <div className="flex flex-col gap-8">
                        {/* ── Edit Profile ── */}
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <User size={20} className="text-blue-600" />
                                    <Typography variant="h6" fontWeight={800}>Profile Details</Typography>
                                </div>
                                <form onSubmit={handleUpdateProfile}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Full Name"
                                                name="fullName"
                                                fullWidth
                                                value={profileData.fullName}
                                                onChange={handleProfileChange}
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Email Address"
                                                name="email"
                                                type="email"
                                                fullWidth
                                                value={profileData.email}
                                                onChange={handleProfileChange}
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                startIcon={<Save size={18} />}
                                                disabled={loading}
                                                sx={{ borderRadius: 3, px: 4, py: 1.2 }}
                                            >
                                                Save Changes
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>

                        {/* ── Change Password ── */}
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <Key size={20} className="text-orange-600" />
                                    <Typography variant="h6" fontWeight={800}>Security</Typography>
                                </div>
                                <form onSubmit={handleChangePassword}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Current Password"
                                                name="oldPassword"
                                                type={showPasswords ? "text" : "password"}
                                                fullWidth
                                                required
                                                value={passwords.oldPassword}
                                                onChange={handlePasswordChange}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton onClick={() => setShowPasswords(!showPasswords)}>
                                                                {showPasswords ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="New Password"
                                                name="newPassword"
                                                type={showPasswords ? "text" : "password"}
                                                fullWidth
                                                required
                                                value={passwords.newPassword}
                                                onChange={handlePasswordChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Confirm New Password"
                                                name="confirmPassword"
                                                type={showPasswords ? "text" : "password"}
                                                fullWidth
                                                required
                                                value={passwords.confirmPassword}
                                                onChange={handlePasswordChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button
                                                type="submit"
                                                variant="outlined"
                                                color="warning"
                                                startIcon={<Lock size={18} />}
                                                disabled={loading}
                                                sx={{ borderRadius: 3, px: 4, py: 1.2 }}
                                            >
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
