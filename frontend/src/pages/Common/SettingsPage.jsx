import React, { useState } from 'react';
import {
    Settings, Bell, Moon, Sun, Globe,
    Shield, User, Smartphone, Eye, EyeOff
} from 'lucide-react';
import {
    Typography, Card, CardContent, Grid,
    Switch, FormControlLabel, Button, Divider,
    Select, MenuItem, InputLabel, FormControl,
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
        <div className="max-w-5xl mx-auto pb-12">
            <div className="mb-8">
                <Typography variant="h5" color="text.primary">Settings</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    Manage your account preferences and clinic configurations
                </Typography>
            </div>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
                        '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '1rem' }
                    }}
                >
                    <Tab icon={<User size={18} />} iconPosition="start" label="Profile" />
                    <Tab icon={<Bell size={18} />} iconPosition="start" label="Notifications" />
                    <Tab icon={<Globe size={18} />} iconPosition="start" label="Appearance" />
                    <Tab icon={<Shield size={18} />} iconPosition="start" label="Security" />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <ProfilePage />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                            <CardContent className="p-6">
                                <Typography variant="subtitle1" gutterBottom>Notification Preferences</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Choose how you want to receive alerts and updates
                                </Typography>
                                <div className="flex flex-col gap-4">
                                    <FormControlLabel
                                        control={<Switch checked={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} />}
                                        label={
                                            <div>
                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Email Notifications</Typography>
                                                <Typography variant="caption" color="text.secondary">Receive appointment reminders and system alerts via email</Typography>
                                            </div>
                                        }
                                    />
                                    <Divider />
                                    <FormControlLabel
                                        control={<Switch checked={settings.smsNotifications} onChange={() => handleToggle('smsNotifications')} />}
                                        label={
                                            <div>
                                                <Typography variant="body1" fontWeight={600}>SMS Notifications</Typography>
                                                <Typography variant="caption" color="text.secondary">Get instant SMS alerts for urgent updates</Typography>
                                            </div>
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                            <CardContent className="p-6">
                                <Typography variant="h6" fontWeight={800} gutterBottom>Visual Settings</Typography>
                                <div className="flex flex-col gap-6">
                                    <FormControlLabel
                                        control={<Switch checked={settings.darkMode} onChange={() => handleToggle('darkMode')} />}
                                        label={
                                            <div className="flex items-center gap-3">
                                                {settings.darkMode ? <Moon size={20} /> : <Sun size={20} />}
                                                <div>
                                                    <Typography variant="body1" fontWeight={600}>Dark Mode</Typography>
                                                    <Typography variant="caption" color="text.secondary">Adjust the interface for lower light environments</Typography>
                                                </div>
                                            </div>
                                        }
                                    />
                                    <Divider />
                                    <FormControl fullWidth>
                                        <InputLabel id="language-select-label">System Language</InputLabel>
                                        <Select
                                            labelId="language-select-label"
                                            value={settings.language}
                                            label="System Language"
                                            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                            sx={{ borderRadius: 3 }}
                                        >
                                            <MenuItem value="English">English</MenuItem>
                                            <MenuItem value="Spanish">Spanish</MenuItem>
                                            <MenuItem value="French">French</MenuItem>
                                            <MenuItem value="Amharic">Amharic</MenuItem>
                                        </Select>
                                    </FormControl>
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                    <CardContent className="p-6">
                        <Typography variant="h6" fontWeight={800} gutterBottom>Advanced Security</Typography>
                        <div className="flex flex-col gap-4">
                            <FormControlLabel
                                control={<Switch checked={settings.twoFactor} onChange={() => handleToggle('twoFactor')} />}
                                label={
                                    <div>
                                        <Typography variant="body1" fontWeight={600}>Two-Factor Authentication (2FA)</Typography>
                                        <Typography variant="caption" color="text.secondary">Add an extra layer of security to your account</Typography>
                                    </div>
                                }
                            />
                            <Divider />
                            <div>
                                <Typography variant="body1" fontWeight={600} gutterBottom>Recent Login Activity</Typography>
                                <Typography variant="caption" color="text.secondary">No unusual login attempts detected recently.</Typography>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabPanel>
        </div>
    );
}
