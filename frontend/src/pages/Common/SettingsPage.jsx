import React, { useState } from 'react';
import {
    Settings, Bell, Moon, Sun, Globe,
    Shield, User, Smartphone, Eye, EyeOff
} from 'lucide-react';
import {
    Typography, Card, CardContent,
    Switch, FormControlLabel, Button, Divider,
    Select, MenuItem, FormControl,
    Box, Tab, Tabs, useTheme
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '../../context/ThemeContext';
import ProfilePage from './ProfilePage';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function SettingsPage() {
    const { user } = useSelector((s) => s.auth);
    const { t } = useTranslation();
    const { toggleColorMode } = useColorMode();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [tabValue, setTabValue] = useState(0);

    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        twoFactor: false
    });

    const handleToggle = (name) => {
        setSettings({ ...settings, [name]: !settings[name] });
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
            {/* ── Page Header ── */}
            <div className="mb-6">
                <Typography variant="h5" fontWeight={800} color="text.primary">
                    {t('sidebar.settings')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                    {t('settings.subtitle', 'Manage your account preferences and clinic configurations')}
                </Typography>
            </div>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
                        '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 48, px: 3 }
                    }}
                >
                    <Tab icon={<User size={18} />} iconPosition="start" label={t('common.profile', 'Profile')} />
                    <Tab icon={<Bell size={18} />} iconPosition="start" label={t('settings.notifications', 'Notifications')} />
                    <Tab icon={<Globe size={18} />} iconPosition="start" label={t('settings.appearance', 'Appearance')} />
                    <Tab icon={<Shield size={18} />} iconPosition="start" label={t('settings.security', 'Security')} />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <ProfilePage />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <div className="max-w-2xl">
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom>
                                {t('settings.notifPrefs', 'Notification Preferences')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
                                {t('settings.notifDesc', 'Choose how you want to receive alerts and updates from the clinic')}
                            </Typography>
                            <div className="flex flex-col gap-6">
                                <FormControlLabel
                                    control={<Switch checked={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} color="primary" />}
                                    label={
                                        <div className="ml-2">
                                            <Typography variant="body2" fontWeight={700}>{t('settings.emailNotif', 'Email Notifications')}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                {t('settings.emailNotifDesc', 'Receive appointment reminders and system alerts via email')}
                                            </Typography>
                                        </div>
                                    }
                                />
                                <Divider />
                                <FormControlLabel
                                    control={<Switch checked={settings.smsNotifications} onChange={() => handleToggle('smsNotifications')} color="primary" />}
                                    label={
                                        <div className="ml-2">
                                            <Typography variant="body2" fontWeight={700}>{t('settings.smsNotif', 'SMS Notifications')}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                {t('settings.smsNotifDesc', 'Get instant SMS alerts for urgent updates and schedule changes')}
                                            </Typography>
                                        </div>
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <div className="max-w-2xl space-y-4">
                    {/* Dark Mode Card */}
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom>
                                {t('settings.visualLang', 'Visual & Language')}
                            </Typography>
                            <div className="flex flex-col gap-6 mt-4">
                                {/* Dark mode toggle — wired to real ThemeContext */}
                                <div className="flex items-center justify-between p-4 rounded-2xl border"
                                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                                            style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: isDark ? '#94a3b8' : '#64748b' }}>
                                            {isDark ? <Moon size={20} /> : <Sun size={20} />}
                                        </div>
                                        <div>
                                            <Typography variant="body2" fontWeight={700}>
                                                {t('settings.darkMode', 'Dark Mode')}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                {isDark
                                                    ? t('settings.darkModeOn', 'Dark interface is active')
                                                    : t('settings.darkModeOff', 'Switch to dark interface theme')}
                                            </Typography>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={isDark}
                                        onChange={toggleColorMode}
                                        color="primary"
                                        inputProps={{ 'aria-label': 'Toggle dark mode' }}
                                    />
                                </div>

                                <Divider />

                                {/* Language switcher */}
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 800, letterSpacing: '0.1em' }}>
                                        {t('settings.language', 'System Language')}
                                    </Typography>
                                    <div className="p-4 rounded-2xl border flex items-center justify-between"
                                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-input-bg)' }}>
                                        <div className="flex items-center gap-3">
                                            <Globe size={18} className="text-teal-600" />
                                            <Typography variant="body2" fontWeight={700}>
                                                {t('settings.changeLanguage', 'Change Language')}
                                            </Typography>
                                        </div>
                                        <LanguageSwitcher />
                                    </div>
                                </Box>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
                <div className="max-w-2xl">
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom>
                                {t('settings.accountSecurity', 'Account Security')}
                            </Typography>
                            <div className="flex flex-col gap-6 mt-4">
                                <FormControlLabel
                                    control={<Switch checked={settings.twoFactor} onChange={() => handleToggle('twoFactor')} color="primary" />}
                                    label={
                                        <div className="ml-2">
                                            <Typography variant="body2" fontWeight={700}>
                                                {t('settings.twoFactor', 'Two-Factor Authentication')}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                {t('settings.twoFactorDesc', 'Protect your account with an extra verification step')}
                                            </Typography>
                                        </div>
                                    }
                                />
                                <Divider />
                                <div className="p-5 rounded-2xl border flex items-start gap-4"
                                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-input-bg)' }}>
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-teal-600 shadow-sm shrink-0"
                                        style={{ backgroundColor: 'var(--color-card)' }}>
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <Typography variant="body2" fontWeight={700}>
                                            {t('settings.securityAudit', 'Security Audit')}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 500, lineHeight: 1.5 }}>
                                            {t('settings.lastLogin', 'Last login')}: {new Date().toLocaleDateString()}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabPanel>
        </Box>
    );
}