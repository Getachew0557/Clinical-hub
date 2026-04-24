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

        // Poll every 15 seconds for new notifications
        const interval = setInterval(fetchNotifications, 15000);

        // Also refresh when window regains focus
        const onFocus = () => fetchNotifications();
        window.addEventListener('focus', onFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
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

    const handleNotificationClick = (notification) => {
        let targetLink = notification.link;

        // Fallback navigation if link is missing
        if (!targetLink) {
            const title = (notification.title || '').toLowerCase();
            const message = (notification.message || '').toLowerCase();

            if (title.includes('appointment') || message.includes('appointment')) {
                targetLink = '/appointments';
            } else if (title.includes('welcome') || title.includes('register')) {
                targetLink = '/profile';
            } else if (title.includes('bill') || title.includes('invoice') || message.includes('pay')) {
                targetLink = '/billing';
            } else if (title.includes('medical') || title.includes('emr') || title.includes('record')) {
                targetLink = '/emr';
            }
        }

        // Navigate immediately for better UX
        if (targetLink) {
            handleClose();
            navigate(targetLink);
        }

        // Mark as read in the background
        if (!notification.isRead) {
            // Optimistic UI update
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
            );
            // Async API call without blocking UI
            notificationService.markAsRead(notification.id).catch(error => {
                console.error('Failed to mark read:', error);
            });
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
                                height: 16,
                                minWidth: 16,
                                px: 0.5,
                                fontWeight: 800
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
                <Box sx={{ 
                    p: 2.5, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    bgcolor: 'white', 
                    borderBottom: '1px solid #f1f5f9' 
                }}>
                    <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: '1.1rem' }}>
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            onClick={handleMarkAllRead}
                            sx={{ 
                                fontWeight: 800, 
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 1.5,
                                fontSize: '0.75rem',
                                bgcolor: 'blue.50',
                                color: 'blue.600',
                                '&:hover': { bgcolor: 'blue.100' }
                            }}
                        >
                            Mark all read
                        </Button>
                    )}
                </Box>

                {/* List */}
                <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 420 }}>
                    {loading && notifications.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                            <CircularProgress size={28} thickness={5} />
                        </Box>
                    ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <Box
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    p: 2.5,
                                    display: 'flex',
                                    gap: 2.5,
                                    bgcolor: notification.isRead ? 'transparent' : 'rgba(239, 246, 255, 0.5)',
                                    borderBottom: '1px solid #f1f5f9',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    '&:hover': { 
                                        bgcolor: 'white',
                                        boxShadow: 'inset 4px 0 0 #3b82f6'
                                    },
                                    '&:active': { transform: 'scale(0.98)' }
                                }}
                            >
                                <Box sx={{ 
                                    flexShrink: 0, 
                                    width: 44, 
                                    height: 44, 
                                    borderRadius: 3.5, 
                                    bgcolor: '#f8fafc', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    border: '1px solid #f1f5f9'
                                }}>
                                    {getIcon(notification.type)}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <div className="flex justify-between items-start mb-0.5">
                                        <Typography variant="subtitle2" fontWeight={notification.isRead ? 700 : 900} color="text.primary" sx={{ lineHeight: 1.3 }}>
                                            {notification.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, fontSize: '0.65rem', whiteSpace: 'nowrap', ml: 1 }}>
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: false })}
                                        </Typography>
                                    </div>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.85rem' }}>
                                        {notification.message}
                                    </Typography>
                                </Box>
                                {!notification.isRead && (
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 1, flexShrink: 0, boxShadow: '0 0 0 2px white' }} />
                                )}
                            </Box>
                        ))
                    ) : (
                        <Box sx={{ p: 8, textAlign: 'center' }}>
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Bell size={32} className="text-slate-300" />
                            </div>
                            <Typography variant="subtitle2" color="text.primary" fontWeight={800}>
                                All caught up!
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                No new notifications at the moment.
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
