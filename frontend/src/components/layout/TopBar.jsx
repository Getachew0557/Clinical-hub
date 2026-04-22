import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Menu, Bell, Search, LogOut, Settings, ChevronDown, User,
} from 'lucide-react';
import {
    Avatar, Badge, IconButton, Tooltip,
    Menu as MuiMenu, MenuItem, ListItemIcon, Divider, InputBase, Typography,
} from '@mui/material';
import { logout } from '../../store/slices/authSlice';
import NotificationsMenu from './NotificationsMenu';
import LanguageSwitcher from '../common/LanguageSwitcher';
import doctorService from '../../api/doctor.service';
import patientService from '../../api/patient.service';
import { getDoctorPhotoUrl, getAuthPhotoUrl } from '../../utils/cn';

export default function TopBar({ onMenuClick }) {
    const { user } = useSelector((s) => s.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState(null);
    const [profilePhoto, setProfilePhoto] = useState(null);

    const initials = user?.fullName
        ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase()
        : 'U';

    // Load profile photo based on role
    useEffect(() => {
        if (!user) return;
        
        // Priority 1: Auth service photo (newly implemented for everyone)
        if (user.profilePhoto) {
            setProfilePhoto(getAuthPhotoUrl(user.profilePhoto));
            return;
        }

        // Priority 2: Role-specific profile photo (legacy/doctors/patients)
        if (user.role === 'Doctor') {
            doctorService.getMyProfile()
                .then(data => {
                    const p = data?.doctor || data;
                    if (p?.profilePhoto) setProfilePhoto(getDoctorPhotoUrl(p.profilePhoto));
                })
                .catch(() => {});
        } else if (user.role === 'Patient') {
            patientService.getMyProfile()
                .then(data => {
                    const p = data?.patient || data;
                    if (p?.profilePhoto) setProfilePhoto(p.profilePhoto);
                })
                .catch(() => {});
        }
    }, [user]);

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
                {/* Mobile-only hamburger */}
                <div className="lg:hidden">
                    <IconButton
                        onClick={onMenuClick}
                        size="small"
                        sx={{ color: '#64748b' }}
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </IconButton>
                </div>

                {/* Search bar */}
                <div className="hidden md:flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 min-w-[260px]">
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <InputBase
                        placeholder={t('common.searchPlaceholder')}
                        sx={{ flex: 1, color: '#334155' }}
                        inputProps={{ 'aria-label': 'search' }}
                    />
                </div>
            </div>

            {/* Right: Language + Notifications + User */}
            <div className="flex items-center gap-2">
                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Notification Menu */}
                <NotificationsMenu />

                {/* User Avatar */}
                <button
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors"
                    aria-label="User menu"
                >
                    <Avatar
                        src={profilePhoto || undefined}
                        sx={{ width: 34, height: 34, bgcolor: roleColor, fontWeight: 800 }}
                    >
                        {!profilePhoto && initials}
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start leading-tight">
                        <span className="text-sm font-semibold text-slate-800">{user?.fullName || 'User'}</span>
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
                    <div className="px-4 py-3 flex items-center gap-3">
                        <Avatar
                            src={profilePhoto || undefined}
                            sx={{ width: 40, height: 40, bgcolor: roleColor, fontWeight: 800 }}
                        >
                            {!profilePhoto && initials}
                        </Avatar>
                        <div>
                            <Typography variant="subtitle2" fontWeight={700}>{user?.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                        </div>
                    </div>
                    <Divider />
                    <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                        <ListItemIcon><Settings size={16} /></ListItemIcon>
                        {t('common.settings')}
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                        <ListItemIcon><LogOut size={16} color="#ef4444" /></ListItemIcon>
                        {t('common.signOut')}
                    </MenuItem>
                </MuiMenu>
            </div>
        </header>
    );
}
