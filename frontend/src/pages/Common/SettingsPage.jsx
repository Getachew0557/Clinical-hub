import React, { useState } from 'react';
import {
    Settings, Bell, Moon, Sun, Globe,
    Shield, User, Smartphone, Eye, EyeOff
} from 'lucide-react';
import {
    Typography, Card, CardContent,
    Switch, FormControlLabel, Button, Divider,
    Select, MenuItem, FormControl,
    Box, Tab, Tabs
} from '@mui/material';
import { useSelector } from 'react-redux';
import ProfilePage from './ProfilePage';

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
    const [tabValue, setTabValue] = useState(0);

    // Mock Preferences
    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        darkMode: false,
        language: 'English',
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
                <Typography variant="h5" fontWeight={700} color="text.primary">Settings</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    Manage your account preferences and clinic configurations
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
                        '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', minHeight: 44 }
                    }}
                >
                    <Tab icon={<User size={16} />} iconPosition="start" label="Profile" />
                    <Tab icon={<Bell size={16} />} iconPosition="start" label="Notifications" />
                    <Tab icon={<Globe size={16} />} iconPosition="start" label="Appearance" />
                    <Tab icon={<Shield size={16} />} iconPosition="start" label="Security" />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <ProfilePage />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <div className="max-w-2xl">
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Notification Preferences</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Choose how you want to receive alerts and updates
                            </Typography>
                            <div className="flex flex-col gap-5">
                                <FormControlLabel
                                    control={<Switch checked={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} color="primary" />}
                                    label={
                                        <div>
                                            <Typography variant="body2" fontWeight={600}>Email Notifications</Typography>
                                            <Typography variant="caption" color="text.secondary">Receive appointment reminders and system alerts via email</Typography>
                                        </div>
                                    }
                                />
                                <Divider />
                                <FormControlLabel
                                    control={<Switch checked={settings.smsNotifications} onChange={() => handleToggle('smsNotifications')} color="primary" />}
                                    label={
                                        <div>
                                            <Typography variant="body2" fontWeight={600}>SMS Notifications</Typography>
                                            <Typography variant="caption" color="text.secondary">Get instant SMS alerts for urgent updates</Typography>
                                        </div>
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <div className="max-w-2xl">
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Visual Settings</Typography>
                            <div className="flex flex-col gap-5">
                                <FormControlLabel
                                    control={<Switch checked={settings.darkMode} onChange={() => handleToggle('darkMode')} color="primary" />}
                                    label={
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                                                {settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                                            </div>
                                            <div>
                                                <Typography variant="body2" fontWeight={600}>Dark Mode</Typography>
                                                <Typography variant="caption" color="text.secondary">Adjust the interface for lower light environments</Typography>
                                            </div>
                                        </div>
                                    }
                                />
                                <Divider />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        System Language
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={settings.language}
                                            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value="English">🇬🇧 English</MenuItem>
                                            <MenuItem value="Amharic">🇪🇹 Amharic</MenuItem>
                                            <MenuItem value="Spanish">🇪🇸 Spanish</MenuItem>
                                            <MenuItem value="French">🇫🇷 French</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
                <div className="max-w-2xl">
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Security</Typography>
                            <div className="flex flex-col gap-5">
                                <FormControlLabel
                                    control={<Switch checked={settings.twoFactor} onChange={() => handleToggle('twoFactor')} color="primary" />}
                                    label={
                                        <div>
                                            <Typography variant="body2" fontWeight={600}>Two-Factor Authentication</Typography>
                                            <Typography variant="caption" color="text.secondary">Add an extra layer of security to your account</Typography>
                                        </div>
                                    }
                                />
                                <Divider />
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Shield size={15} className="text-teal-500" />
                                        <Typography variant="body2" fontWeight={600}>Recent Login Activity</Typography>
                                    </div>
                                    <Typography variant="caption" color="text.secondary">
                                        Last login: {new Date().toLocaleDateString()} from Addis Ababa, Ethiopia.
                                    </Typography>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabPanel>
        </Box>
    );
}
