import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, Users, CalendarDays, FileText, Receipt,
    Package, BarChart3, Settings, ChevronLeft, ChevronRight,
    X, Stethoscope, UserCog, ClipboardList, Home, ShieldCheck, Video
} from 'lucide-react';
import { cn } from '../../utils/cn';

// ── Role-based nav items (use translation keys) ──────────────────────────────
const NAV_BY_ROLE = {
    Admin: [
        { to: '/dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard', end: true },
        { to: '/patients', icon: Users, labelKey: 'sidebar.patients' },
        { to: '/doctors', icon: Stethoscope, labelKey: 'sidebar.doctors' },
        { to: '/receptionists', icon: ShieldCheck, labelKey: 'sidebar.receptionists' },
        { to: '/appointments', icon: CalendarDays, labelKey: 'sidebar.appointments' },
        { to: '/emr', icon: FileText, labelKey: 'sidebar.medicalRecords' },
        { to: '/inventory', icon: Package, labelKey: 'sidebar.inventory' },
        { to: '/reports', icon: BarChart3, labelKey: 'sidebar.reports' },
        { to: '/settings', icon: UserCog, labelKey: 'sidebar.settings' },
    ],
    Doctor: [
        { to: '/dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard', end: true },
        { to: '/appointments', icon: CalendarDays, labelKey: 'sidebar.myAppointments' },
        { to: '/video-consultations', icon: Video, labelKey: 'sidebar.videoConsultations' },
        { to: '/emr', icon: FileText, labelKey: 'sidebar.medicalRecords' },
        { to: '/patients', icon: Users, labelKey: 'sidebar.myPatients' },
        { to: '/settings', icon: UserCog, labelKey: 'sidebar.settings' },
    ],
    Receptionist: [
        { to: '/dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard', end: true },
        { to: '/patients', icon: Users, labelKey: 'sidebar.patients' },
        { to: '/doctors', icon: Stethoscope, labelKey: 'sidebar.doctors' },
        { to: '/appointments', icon: CalendarDays, labelKey: 'sidebar.appointments' },
        { to: '/inventory', icon: Package, labelKey: 'sidebar.inventory' },
        { to: '/settings', icon: UserCog, labelKey: 'sidebar.settings' },
    ],
    Patient: [
        { to: '/dashboard', icon: Home, labelKey: 'sidebar.myPortal', end: true },
        { to: '/appointments', icon: CalendarDays, labelKey: 'sidebar.bookings' },
        { to: '/emr', icon: FileText, labelKey: 'sidebar.myRecords' },
        { to: '/billing', icon: Receipt, labelKey: 'sidebar.myBills' },
        { to: '/settings', icon: UserCog, labelKey: 'sidebar.settings' },
    ],
};

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
    const location = useLocation();
    const { user } = useSelector((s) => s.auth);
    const { t } = useTranslation();
    const role = user?.role || 'Patient';
    const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.Patient;

    const sidebarContent = (
        <div className="flex h-full flex-col" style={{ background: 'linear-gradient(180deg, #0a2540 0%, #0d4f4a 100%)', color: '#e2e8f0' }}>
            {/* ── Logo ── */}
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 shadow-lg">
                        <Stethoscope className="h-5 w-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col leading-tight">
                            <span className="text-sm font-bold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>Biruh Tena</span>
                            <span className="text-[11px] text-teal-300" style={{ fontFamily: 'Noto Serif Ethiopic, serif' }}>ብሩህ ጤና</span>
                        </div>
                    )}
                </div>
                {/* mobile close */}
                <button
                    onClick={onMobileClose}
                    className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
                    aria-label="Close sidebar"
                >
                    <X className="h-5 w-5" />
                </button>
                {/* desktop collapse toggle */}
                <button
                    onClick={onToggle}
                    className="hidden rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white lg:block"
                    aria-label="Toggle sidebar"
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
            </div>

            {/* ── Role badge ── */}
            {!collapsed && (
                <div className="px-4 py-3">
                    <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                        <UserCog className="h-4 w-4 text-teal-300" />
                        <span className="text-xs font-medium text-teal-200">{t('sidebar.roleAccess', { role })}</span>
                    </div>
                </div>
            )}

            {/* ── Nav Items ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main navigation">
                <ul className="flex flex-col gap-1">
                    {navItems.map((item) => {
                        const isActive = item.end
                            ? location.pathname === item.to
                            : location.pathname.startsWith(item.to);
                        return (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    end={item.end}
                                    onClick={onMobileClose}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                                    )}
                                    title={collapsed ? t(item.labelKey) : undefined}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    {!collapsed && <span>{t(item.labelKey)}</span>}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* ── Footer: Clinic Hours ── */}
            {!collapsed && (
                <div className="border-t border-white/10 p-4">
                    <div className="rounded-xl bg-white/10 px-3 py-3">
                        <p className="text-xs font-semibold text-white/80">{t('sidebar.clinicHours')}</p>
                        <p className="text-[11px] text-white/50 mt-0.5">{t('sidebar.weekdayHours')}</p>
                        <p className="text-[11px] text-white/50">{t('sidebar.saturdayHours')}</p>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={onMobileClose}
                    aria-hidden="true"
                />
            )}

            {/* Mobile sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 lg:hidden',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {sidebarContent}
            </aside>

            {/* Desktop sidebar */}
            <aside
                className={cn(
                    'hidden shrink-0 transition-all duration-300 lg:block',
                    collapsed ? 'w-[68px]' : 'w-64'
                )}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
