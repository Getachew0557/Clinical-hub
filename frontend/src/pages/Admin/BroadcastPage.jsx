import React, { useState, useEffect } from 'react';
import {
    Typography, Card, CardContent, Box, Button, TextField,
    FormControl, Select, MenuItem, Chip, CircularProgress,
    Alert, Grid, InputLabel
} from '@mui/material';
import { Bell, Send, Users, Stethoscope, ShieldCheck, User } from 'lucide-react';
import authService from '../../api/auth.service';

const API_NOTIFY = import.meta.env.VITE_API_NOTIFICATION_URL;
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

const ROLE_OPTIONS = [
    { value: 'All', label: 'All Users', icon: Users, color: '#0d9488' },
    { value: 'Patient', label: 'Patients Only', icon: User, color: '#2563eb' },
    { value: 'Doctor', label: 'Doctors Only', icon: Stethoscope, color: '#059669' },
    { value: 'Receptionist', label: 'Receptionists Only', icon: ShieldCheck, color: '#7c3aed' },
];

const TYPE_OPTIONS = ['Info', 'Success', 'Warning', 'Error'];

export default function BroadcastPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        targetRole: 'All',
        title: '',
        message: '',
        type: 'Info',
        link: '/dashboard',
    });

    useEffect(() => {
        authService.getAllUsers().then(data => {
            setUsers(Array.isArray(data) ? data : []);
        }).catch(() => {});
    }, []);

    const getTargetCount = () => {
        if (form.targetRole === 'All') return users.length;
        return users.filter(u => u.role === form.targetRole).length;
    };

    const handleSend = async () => {
        if (!form.title.trim() || !form.message.trim()) {
            setError('Title and message are required.');
            return;
        }
        setSending(true);
        setError('');
        setSuccess('');
        try {
            const targets = form.targetRole === 'All'
                ? users
                : users.filter(u => u.role === form.targetRole);

            let sent = 0;
            // Send in batches of 10 to avoid overwhelming the server
            for (let i = 0; i < targets.length; i += 10) {
                const batch = targets.slice(i, i + 10);
                await Promise.all(batch.map(u =>
                    fetch(`${API_NOTIFY}/internal`, {
                        method: 'POST',
                        headers: getAuthHeader(),
                        body: JSON.stringify({
                            userId: u.id,
                            title: form.title,
                            message: form.message,
                            type: form.type,
                            link: form.link || '/dashboard',
                        }),
                    }).catch(() => {})
                ));
                sent += batch.length;
            }

            setSuccess(`✅ Broadcast sent to ${sent} user${sent !== 1 ? 's' : ''} successfully.`);
            setForm(prev => ({ ...prev, title: '', message: '' }));
        } catch (err) {
            setError('Failed to send broadcast. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
            <div className="flex flex-col gap-6">

                <div>
                    <Typography variant="h5" fontWeight={700} color="text.primary">Broadcast Notifications</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        Send announcements to all users or specific roles
                    </Typography>
                </div>

                {success && <Alert severity="success" sx={{ borderRadius: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}
                {error && <Alert severity="error" sx={{ borderRadius: 3 }} onClose={() => setError('')}>{error}</Alert>}

                <Grid container spacing={4}>
                    {/* Compose */}
                    <Grid item xs={12} md={8}>
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                            <CardContent sx={{ p: 4 }}>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                                        <Bell size={20} className="text-teal-600" />
                                    </div>
                                    <Typography variant="h6" fontWeight={700}>Compose Broadcast</Typography>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {/* Target Role */}
                                    <div>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Target Audience
                                        </Typography>
                                        <div className="flex flex-wrap gap-2">
                                            {ROLE_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setForm(p => ({ ...p, targetRole: opt.value }))}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                                                        form.targetRole === opt.value
                                                            ? 'border-teal-600 bg-teal-600 text-white'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
                                                    }`}
                                                >
                                                    <opt.icon size={14} />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Type */}
                                    <div>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Notification Type
                                        </Typography>
                                        <div className="flex gap-2">
                                            {TYPE_OPTIONS.map(t => {
                                                const colors = {
                                                    Info: 'bg-blue-50 text-blue-700 border-blue-200',
                                                    Success: 'bg-green-50 text-green-700 border-green-200',
                                                    Warning: 'bg-amber-50 text-amber-700 border-amber-200',
                                                    Error: 'bg-red-50 text-red-700 border-red-200',
                                                };
                                                const active = {
                                                    Info: 'bg-blue-600 text-white border-blue-600',
                                                    Success: 'bg-green-600 text-white border-green-600',
                                                    Warning: 'bg-amber-500 text-white border-amber-500',
                                                    Error: 'bg-red-600 text-white border-red-600',
                                                };
                                                return (
                                                    <button
                                                        key={t}
                                                        onClick={() => setForm(p => ({ ...p, type: t }))}
                                                        className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                                                            form.type === t ? active[t] : colors[t]
                                                        }`}
                                                    >
                                                        {t}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <TextField
                                        label="Notification Title"
                                        fullWidth
                                        required
                                        placeholder="e.g. System Maintenance Notice"
                                        value={form.title}
                                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    />

                                    {/* Message */}
                                    <TextField
                                        label="Message"
                                        fullWidth
                                        required
                                        multiline
                                        rows={4}
                                        placeholder="Write your announcement here..."
                                        value={form.message}
                                        onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                    />

                                    {/* Link */}
                                    <TextField
                                        label="Action Link (optional)"
                                        fullWidth
                                        placeholder="/appointments"
                                        value={form.link}
                                        onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                                        helperText="Where users go when they click the notification"
                                    />

                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
                                        onClick={handleSend}
                                        disabled={sending || !form.title.trim() || !form.message.trim()}
                                        sx={{ borderRadius: 3, alignSelf: 'flex-start', px: 4 }}
                                    >
                                        {sending ? 'Sending...' : `Send to ${getTargetCount()} User${getTargetCount() !== 1 ? 's' : ''}`}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Preview */}
                    <Grid item xs={12} md={4}>
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Preview</Typography>
                                <div className={`p-4 rounded-xl border ${
                                    form.type === 'Success' ? 'bg-green-50 border-green-200' :
                                    form.type === 'Warning' ? 'bg-amber-50 border-amber-200' :
                                    form.type === 'Error'   ? 'bg-red-50 border-red-200' :
                                    'bg-blue-50 border-blue-200'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        <Bell size={18} className={
                                            form.type === 'Success' ? 'text-green-600' :
                                            form.type === 'Warning' ? 'text-amber-600' :
                                            form.type === 'Error'   ? 'text-red-600' :
                                            'text-blue-600'
                                        } />
                                        <div>
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                {form.title || 'Notification Title'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                {form.message || 'Your message will appear here...'}
                                            </Typography>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
                                        RECIPIENTS
                                    </Typography>
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-teal-600" />
                                        <Typography variant="body2" fontWeight={700}>
                                            {getTargetCount()} {form.targetRole === 'All' ? 'users' : form.targetRole.toLowerCase() + 's'}
                                        </Typography>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {(form.targetRole === 'All' ? ['Admin', 'Doctor', 'Receptionist', 'Patient'] : [form.targetRole]).map(r => (
                                            <Chip key={r} label={r} size="small" sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </div>
        </Box>
    );
}
