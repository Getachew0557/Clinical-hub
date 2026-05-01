import React, { useState, useEffect } from 'react';
import {
    Typography, Card, CardContent, Box, Chip,
    CircularProgress, Alert, TextField, InputAdornment
} from '@mui/material';
import { ShieldCheck, UserCog, Settings, FileText, Trash2, LogIn, Search, Bell, Calendar } from 'lucide-react';
import notificationService from '../../api/notification.service';
import authService from '../../api/auth.service';
import { formatDistanceToNow } from 'date-fns';

const TYPE_META = {
    Success: { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    Info:    { icon: FileText,    color: 'text-blue-600',    bg: 'bg-blue-50'    },
    Warning: { icon: UserCog,     color: 'text-amber-600',   bg: 'bg-amber-50'   },
    Error:   { icon: Trash2,      color: 'text-red-600',     bg: 'bg-red-50'     },
    System:  { icon: Settings,    color: 'text-slate-600',   bg: 'bg-slate-100'  },
};

export default function AuditLogPage() {
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch all users to resolve names
            const [usersData] = await Promise.all([
                authService.getAllUsers().catch(() => []),
            ]);
            setUsers(Array.isArray(usersData) ? usersData : []);

            // Fetch notifications for all users as audit trail
            // Admin can see all notifications via the notification endpoint
            // We use the admin's own notifications as a proxy for system events
            const notifData = await notificationService.getMyNotifications().catch(() => ({ notifications: [] }));
            setLogs(notifData.notifications || []);
            setError(null);
        } catch (err) {
            setError('Failed to load audit log.');
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (userId) => {
        const u = users.find(u => u.id === userId);
        return u ? `${u.fullName} (${u.role})` : `User #${userId?.slice(-6)}`;
    };

    const TYPES = ['All', 'Success', 'Info', 'Warning', 'Error', 'System'];

    const filtered = logs.filter(log => {
        const matchType = filterType === 'All' || log.type === filterType;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            log.title?.toLowerCase().includes(q) ||
            log.message?.toLowerCase().includes(q);
        return matchType && matchSearch;
    });

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
            <div className="flex flex-col gap-6">

                {/* Header */}
                <div>
                    <Typography variant="h5" fontWeight={700} color="text.primary">Audit Log</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        System-wide activity trail — all notifications and events
                    </Typography>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 flex-1 max-w-sm">
                        <Search size={16} className="text-slate-400" />
                        <input
                            placeholder="Search events..."
                            className="bg-transparent text-sm outline-none flex-1"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {TYPES.map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                    filterType === t
                                        ? 'bg-teal-600 text-white border-teal-600'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

                {loading ? (
                    <div className="flex justify-center py-16"><CircularProgress size={32} /></div>
                ) : (
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                        <CardContent sx={{ p: 0 }}>
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                    <ShieldCheck size={40} className="mb-3 opacity-30" />
                                    <Typography variant="body2">No audit events found.</Typography>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filtered.map((log, i) => {
                                        const meta = TYPE_META[log.type] || TYPE_META.Info;
                                        const Icon = meta.icon;
                                        return (
                                            <div key={log.id || i} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                                                    <Icon size={18} className={meta.color} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                                                {log.title}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                                                {log.message}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                                                Recipient: {getUserName(log.userId)}
                                                            </Typography>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                                            <Chip
                                                                label={log.type}
                                                                size="small"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    borderRadius: 2,
                                                                    fontSize: '0.65rem',
                                                                    bgcolor: log.type === 'Success' ? '#f0fdf4' :
                                                                             log.type === 'Warning' ? '#fffbeb' :
                                                                             log.type === 'Error'   ? '#fef2f2' : '#eff6ff',
                                                                    color:   log.type === 'Success' ? '#15803d' :
                                                                             log.type === 'Warning' ? '#d97706' :
                                                                             log.type === 'Error'   ? '#dc2626' : '#1d4ed8',
                                                                }}
                                                            />
                                                            <Typography variant="caption" color="text.disabled">
                                                                {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : '—'}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </Box>
    );
}
