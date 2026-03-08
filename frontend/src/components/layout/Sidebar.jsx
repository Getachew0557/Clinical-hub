import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    LayoutDashboard, Users, CalendarDays, FileText, Receipt,
    Package, BarChart3, Settings, ChevronLeft, ChevronRight,
    X, Stethoscope, UserCog, ClipboardList, Home,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// ── Role-based nav items ─────────────────────────────────
const NAV_BY_ROLE = {
    Admin: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/patients', icon: Users, label: 'Patients' },
        { to: '/doctors', icon: Stethoscope, label: 'Doctors' },
        { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
        { to: '/emr', icon: FileText, label: 'Medical Records' },
        { to: '/billing', icon: Receipt, label: 'Billing' },
        { to: '/inventory', icon: Package, label: 'Inventory' },
        { to: '/reports', icon: BarChart3, label: 'Reports' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ],
    Doctor: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/appointments', icon: CalendarDays, label: 'My Appointments' },
        { to: '/emr', icon: FileText, label: 'Medical Records' },
        { to: '/patients', icon: Users, label: 'My Patients' },
        { to: '/inventory', icon: Package, label: 'Inventory' },
    ],
    Receptionist: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/patients', icon: Users, label: 'Patients' },
        { to: '/doctors', icon: Stethoscope, label: 'Doctors' },
        { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
        { to: '/billing', icon: Receipt, label: 'Billing' },
        { to: '/inventory', icon: Package, label: 'Inventory' },
    ],
    Patient: [
        { to: '/', icon: Home, label: 'My Portal', end: true },
        { to: '/patients', icon: Users, label: 'My Medical Profile' },
        { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
        { to: '/emr', icon: FileText, label: 'My Records' },
        { to: '/billing', icon: Receipt, label: 'My Invoices' },
    ],
};

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
    const location = useLocation();
    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';
    const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.Patient;

    const sidebarContent = (
        <div className="flex h-full flex-col" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e3a5f 100%)', color: '#e2e8f0' }}>
            {/* ── Logo ── */}
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 shadow-lg">
                        <Stethoscope className="h-5 w-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col leading-tight">
                            <span className="text-sm font-bold text-white">Ras Dental</span>
                            <span className="text-[11px] text-blue-300">Specialty Center</span>
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
                        <UserCog className="h-4 w-4 text-blue-300" />
                        <span className="text-xs font-medium text-blue-200">{role} Access</span>
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
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                                    )}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    {!collapsed && <span>{item.label}</span>}
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
                        <p className="text-xs font-semibold text-white/80">Clinic Hours</p>
                        <p className="text-[11px] text-white/50 mt-0.5">Mon–Fri: 8AM – 6PM</p>
                        <p className="text-[11px] text-white/50">Sat: 9AM – 2PM</p>
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
