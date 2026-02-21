import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    Avatar,
    IconButton,
    Button,
    Chip
} from '@mui/material';
import {
    Notifications,
    Logout,
    CalendarMonth,
    People,
    TrendingUp,
    LocalHospital
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { logout } from '../store/slices/authSlice';

const DashboardPage = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logout());
    };

    const stats = [
        { title: 'Total Patients', value: '1,284', icon: <People />, color: 'bg-blue-500' },
        { title: 'Appointments', value: '42 Today', icon: <CalendarMonth />, color: 'bg-indigo-500' },
        { title: 'Staff Active', value: '12', icon: <LocalHospital />, color: 'bg-emerald-500' },
        { title: 'Revenue', value: '$12.4k', icon: <TrendingUp />, color: 'bg-purple-500' },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navbar */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                <Box className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3 text-white shadow-md">
                        <span className="text-xl">🦷</span>
                    </div>
                    <Typography variant="h5" className="font-bold text-slate-900 hidden sm:block">
                        Ras<span className="text-blue-600">Dental</span>
                    </Typography>
                </Box>

                <Box className="flex items-center gap-4">
                    <IconButton className="bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors">
                        <Notifications />
                    </IconButton>

                    <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                        <div className="text-right hidden sm:block">
                            <Typography variant="body2" className="font-bold text-slate-900">
                                {user?.fullName}
                            </Typography>
                            <Chip label={user?.role} size="small" className="bg-blue-50 text-blue-700 text-[10px] font-bold h-5" />
                        </div>
                        <Avatar className="bg-blue-100 text-blue-600 font-bold uppercase">
                            {user?.fullName?.charAt(0)}
                        </Avatar>
                        <IconButton onClick={handleLogout} className="text-slate-400 hover:text-red-500">
                            <Logout />
                        </IconButton>
                    </div>
                </Box>
            </nav>

            <Container maxWidth="xl" className="py-8">
                <header className="mb-10">
                    <Typography variant="h4" className="font-extrabold text-slate-900 mb-2">
                        Clinic Overview
                    </Typography>
                    <Typography variant="body1" className="text-slate-500">
                        Welcome back, {user?.fullName}. Here is what's happening today.
                    </Typography>
                </header>

                {/* Stats Grid */}
                <Grid container spacing={3} className="mb-10">
                    {stats.map((item, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Paper className="p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-lg hover:border-blue-100 transition-all cursor-pointer">
                                    <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <Typography variant="body2" className="text-slate-400 font-bold uppercase tracking-wider mb-1">
                                            {item.title}
                                        </Typography>
                                        <Typography variant="h4" className="font-extrabold text-slate-900">
                                            {item.value}
                                        </Typography>
                                    </div>
                                </Paper>
                            </motion.div>
                        </Grid>
                    ))} statistics
                </Grid>

                <Grid container spacing={4}>
                    <Grid item xs={12} lg={8}>
                        <Paper className="p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-96 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <CalendarMonth className="text-slate-300 text-4xl" />
                            </div>
                            <Typography variant="h5" className="font-bold text-slate-800 mb-2">
                                No Appointments Selected
                            </Typography>
                            <Typography variant="body1" className="text-slate-500 max-w-md">
                                We are ready to implement the Appointment service next to populate this section with real-time data.
                            </Typography>
                            <Button variant="contained" className="mt-8 bg-blue-600 rounded-xl px-10 py-3 capitalize font-bold">
                                Schedule New
                            </Button>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                        <Paper className="p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <Typography variant="h6" className="font-extrabold text-slate-900 mb-6">
                                Quick Actions
                            </Typography>
                            <div className="space-y-4">
                                {['Add Patient', 'Billing Dashboard', 'Generate Report', 'System Settings'].map((action, i) => (
                                    <Button
                                        key={i}
                                        fullWidth
                                        variant="outlined"
                                        className="justify-start py-4 px-6 border-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all"
                                    >
                                        {action}
                                    </Button>
                                ))}
                            </div>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </div>
    );
};

export default DashboardPage;
