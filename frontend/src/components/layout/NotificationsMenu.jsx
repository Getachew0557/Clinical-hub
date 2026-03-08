import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, CheckCircle, Info, AlertTriangle, XCircle, MoreVertical, Trash2
} from 'lucide-react';
import {
    Badge, IconButton, Tooltip, Menu, MenuItem, Typography,
    Box, Divider, CircularProgress, Button
} from '@mui/material';
import notificationService from '../../api/notification.service';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsMenu() {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    const open = Boolean(anchorEl);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getMyNotifications();
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchNotifications();

        // Polling every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read if unread
        if (!notification.isRead) {
            try {
                await notificationService.markAsRead(notification.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                );
            } catch (error) {
                console.error('Failed to mark read:', error);
            }
        }

        // Navigate if link exists
        if (notification.link) {
            handleClose();
            navigate(notification.link);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIcon = (type) => {
        switch (type) {
            case 'Success': return <CheckCircle size={18} className="text-green-500" />;
            case 'Warning': return <AlertTriangle size={18} className="text-amber-500" />;
            case 'Error': return <XCircle size={18} className="text-red-500" />;
            case 'Info':
            default: return <Info size={18} className="text-blue-500" />;
        }
    };

    return (
        <>
            <Tooltip title="Notifications">
                <IconButton
                    size="small"
                    onClick={handleClick}
                    sx={{ color: '#64748b', transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.04)' } }}
                    aria-label="Notifications"
                >
                    <Badge badgeContent={unreadCount} color="error"
                        sx={{
                            '& .MuiBadge-badge': {
                                fontSize: '0.65rem',
                                height: 16,
                                minWidth: 16,
                                px: 0.5
                            }
                        }}
                    >
                        <Bell size={20} />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={(e) => e.stopPropagation()}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    elevation: 4,
                    sx: {
                        borderRadius: 3,
                        width: 360,
                        maxHeight: 500,
                        mt: 1.5,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    },
                }}
            >
                {/* Header */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            onClick={handleMarkAllRead}
                            sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'none' }}
                        >
                            Mark all as read
                        </Button>
                    )}
                </Box>

                {/* List */}
                <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 400 }}>
                    {loading && notifications.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <Box
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    p: 2,
                                    display: 'flex',
                                    gap: 2,
                                    bgcolor: notification.isRead ? 'transparent' : '#f0fdf4',
                                    borderBottom: '1px solid #f1f5f9',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    '&:hover': { bgcolor: '#f8fafc' }
                                }}
                            >
                                <Box sx={{ mt: 0.5, flexShrink: 0 }}>
                                    {getIcon(notification.type)}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={notification.isRead ? 600 : 700} color="text.primary" sx={{ mb: 0.5, lineHeight: 1.2 }}>
                                        {notification.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.4, fontSize: '0.8rem' }}>
                                        {notification.message}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 500 }}>
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </Typography>
                                </Box>
                                {!notification.isRead && (
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', mt: 1, flexShrink: 0 }} />
                                )}
                            </Box>
                        ))
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Bell size={32} className="mx-auto text-slate-300 mb-2" />
                            <Typography variant="body2" color="text.secondary">
                                You have no notifications.
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Footer */}
                {notifications.length > 0 && (
                    <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0', textAlign: 'center', bgcolor: '#f8fafc' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Showing last {notifications.length} notifications
                        </Typography>
                    </Box>
                )}
            </Menu>
        </>
    );
}
