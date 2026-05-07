import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import AIAssistant from '../components/common/AIAssistant';

export default function DashboardLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <div
            className="flex h-screen overflow-hidden transition-colors duration-200"
            style={{ backgroundColor: theme.palette.background.default, color: theme.palette.text.primary }}
        >
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((v) => !v)}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />
            <div className="flex flex-1 flex-col overflow-hidden min-h-0 min-w-0">
                <TopBar onMenuClick={() => setMobileSidebarOpen(true)} />
                <main
                    className="flex-1 overflow-y-auto scroll-smooth p-4 lg:p-8 custom-scrollbar"
                    style={{ backgroundColor: theme.palette.background.default }}
                >
                    <div className="max-w-[1600px] mx-auto min-h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
            <AIAssistant />
        </div>
    );
}
