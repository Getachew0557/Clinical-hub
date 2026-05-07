import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Typography, Card, CardContent, Box, Chip,
    CircularProgress, Alert, TextField, InputAdornment, InputBase
} from '@mui/material';
import { ShieldCheck, UserCog, Settings, FileText, Trash2, LogIn, Search, Bell, Calendar } from 'lucide-react';
import notificationService from '../../api/notification.service';
import authService from '../../api/auth.service';
import { formatDistanceToNow } from 'date-fns';

const TYPE_META = {
    Success: { icon: ShieldCheck, color: '#10b981', bg: '#ecfdf5' },
    Info:    { icon: FileText,    color: '#3b82f6', bg: '#eff6ff' },
    Warning: { icon: UserCog,     color: '#f59e0b', bg: '#fffbeb' },
    Error:   { icon: Trash2,      color: '#ef4444', bg: '#fef2f2' },
    System:  { icon: Settings,    color: '#64748b', bg: '#f8fafc' },
};

export default function AuditLogPage() {
    const { t } = useTranslation();
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
            const [usersData] = await Promise.all([
                authService.getAllUsers().catch(() => []),
            ]);
            setUsers(Array.isArray(usersData) ? usersData : []);

            const notifData = await notificationService.getMyNotifications().catch(() => ({ notifications: [] }));
            setLogs(notifData.notifications || []);
            setError(null);
        } catch (err) {
            setError(t('common.error'));
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
                    <Typography variant="h5" fontWeight={900} color="text.primary">{t('admin.audit.title')}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {t('admin.audit.subtitle')}
                    </Typography>
                </div>

                {/* Filters */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc', px: 2, py: 1, borderRadius: 2.5, border: '1px solid #e2e8f0', flex: 1, width: '100%' }}>
                        <Search size={18} className="text-slate-400" />
                        <InputBase 
                            placeholder={t('admin.audit.search')}
                            sx={{ ml: 1, flex: 1, fontSize: '0.875rem', fontWeight: 500 }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </Box>
                    <div className="flex gap-2 flex-wrap">
                        {TYPES.map(t_key => (
                            <button
                                key={t_key}
                                onClick={() => setFilterType(t_key)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                    filterType === t_key
                                        ? 'bg-teal-600 text-white border-teal-600'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                                }`}
                            >
                                {t_key === 'All' ? t('common.all') : t_key}
                            </button>
                        ))}
                    </div>
                </Box>

                {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

                {loading ? (
                    <div className="flex justify-center py-16"><CircularProgress size={32} thickness={5} /></div>
                ) : (
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                        <CardContent sx={{ p: 0 }}>
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <ShieldCheck size={48} className="mb-4 opacity-20" />
                                    <Typography variant="body1" fontWeight={600} color="text.secondary">{t('admin.audit.noEvents')}</Typography>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filtered.map((log, i) => {
                                        const meta = TYPE_META[log.type] || TYPE_META.Info;
                                        const Icon = meta.icon;
                                        return (
                                            <div key={log.id || i} className="flex items-start gap-5 p-5 hover:bg-slate-50/50 transition-colors">
                                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-white shadow-sm" style={{ backgroundColor: meta.bg }}>
                                                    <Icon size={20} style={{ color: meta.color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                                        <div>
                                                            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                                                                {log.title}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500, lineHeight: 1.5 }}>
                                                                {log.message}
                                                            </Typography>
                                                            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography variant="caption" fontWeight={700} sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                                                    {t('admin.audit.recipient')}
                                                                </Typography>
                                                                <Typography variant="caption" fontWeight={700} color="primary.main">
                                                                    {getUserName(log.userId)}
                                                                </Typography>
                                                            </Box>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                                            <Chip
                                                                label={log.type}
                                                                size="small"
                                                                sx={{
                                                                    fontWeight: 800,
                                                                    borderRadius: 2,
                                                                    fontSize: '0.7rem',
                                                                    bgcolor: meta.bg,
                                                                    color: meta.color,
                                                                    border: '1px solid rgba(0,0,0,0.05)'
                                                                }}
                                                            />
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                                                                <Calendar size={12} />
                                                                <Typography variant="caption" fontWeight={600}>
                                                                    {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : '—'}
                                                                </Typography>
                                                            </Box>
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

