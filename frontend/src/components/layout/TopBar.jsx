import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Menu, Bell, Search, LogOut, Settings, ChevronDown, User,
} from 'lucide-react';
import {
    Avatar, Badge, IconButton, Tooltip,
    Menu as MuiMenu, MenuItem, ListItemIcon, Divider, InputBase, Typography,
} from '@mui/material';
import { logout } from '../../store/slices/authSlice';

export default function TopBar({ onMenuClick }) {
    const { user } = useSelector((s) => s.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    const initials = user?.fullName
        ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase()
        : 'U';

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const roleColors = {
        Admin: '#2563eb',
        Doctor: '#059669',
        Receptionist: '#7c3aed',
        Patient: '#dc2626',
    };
    const roleColor = roleColors[user?.role] || '#2563eb';

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 shadow-sm">
            {/* Left: Menu + Search */}
            <div className="flex items-center gap-4">
                <IconButton
                    onClick={onMenuClick}
                    size="small"
                    className="lg:hidden"
                    sx={{ color: '#64748b' }}
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </IconButton>

                {/* Search bar */}
                <div className="hidden md:flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 min-w-[260px]">
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <InputBase
                        placeholder="Search patients, appointments…"
                        sx={{ fontSize: '0.875rem', flex: 1, color: '#334155' }}
                        inputProps={{ 'aria-label': 'search' }}
                    />
                </div>
            </div>

            {/* Right: Notifications + User */}
            <div className="flex items-center gap-2">
                {/* Notification bell with badge */}
                <Tooltip title="Notifications">
                    <IconButton size="small" sx={{ color: '#64748b' }} aria-label="Notifications">
                        <Badge badgeContent={3} color="error">
                            <Bell size={20} />
                        </Badge>
                    </IconButton>
                </Tooltip>

                {/* User Avatar */}
                <button
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors"
                    aria-label="User menu"
                >
                    <Avatar
                        sx={{ width: 34, height: 34, bgcolor: roleColor, fontSize: '0.8rem', fontWeight: 700 }}
                    >
                        {initials}
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start leading-tight">
                        <span className="text-sm font-semibold text-slate-800">{user?.fullName || 'User'}</span>
                        <span
                            className="text-[11px] font-medium px-1.5 rounded-full text-white"
                            style={{ backgroundColor: roleColor }}
                        >
                            {user?.role}
                        </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
                </button>

                {/* Dropdown */}
                <MuiMenu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                        elevation: 3,
                        sx: { borderRadius: 3, minWidth: 180, mt: 1 },
                    }}
                >
                    <div className="px-4 py-2">
                        <Typography variant="subtitle2" fontWeight={700}>{user?.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                    </div>
                    <Divider />
                    <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
                        <ListItemIcon><Settings size={16} /></ListItemIcon>
                        Settings
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                        <ListItemIcon><LogOut size={16} color="#ef4444" /></ListItemIcon>
                        Logout
                    </MenuItem>
                </MuiMenu>
            </div>
        </header>
    );
}
