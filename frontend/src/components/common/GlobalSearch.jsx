import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Stethoscope, CalendarDays, FileText, X } from 'lucide-react';
import { CircularProgress, Typography } from '@mui/material';
import patientService from '../../api/patient.service';
import doctorService from '../../api/doctor.service';
import appointmentService from '../../api/appointment.service';
import { useSelector } from 'react-redux';

export default function GlobalSearch() {
    const navigate = useNavigate();
    const { user } = useSelector(s => s.auth);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ patients: [], doctors: [], appointments: [] });
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Ctrl+K / Cmd+K shortcut
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Click outside to close
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced search
    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setResults({ patients: [], doctors: [], appointments: [] });
            return;
        }
        const timer = setTimeout(() => doSearch(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const doSearch = async (q) => {
        setLoading(true);
        try {
            const isStaff = ['Admin', 'Receptionist', 'Doctor'].includes(user?.role);
            const [pRes, dRes, aRes] = await Promise.allSettled([
                isStaff ? patientService.getAllPatients({ search: q }) : Promise.resolve({ patients: [] }),
                doctorService.getPublicDoctors({ search: q }),
                isStaff
                    ? appointmentService.getAllAppointments()
                    : appointmentService.getMyAppointments(),
            ]);

            const patients = (pRes.status === 'fulfilled' ? pRes.value.patients || [] : [])
                .filter(p => p.fullName?.toLowerCase().includes(q.toLowerCase()) || p.email?.toLowerCase().includes(q.toLowerCase()))
                .slice(0, 4);

            const doctors = (dRes.status === 'fulfilled' ? dRes.value.doctors || dRes.value.records || [] : [])
                .filter(d => d.fullName?.toLowerCase().includes(q.toLowerCase()) || d.specialization?.toLowerCase().includes(q.toLowerCase()))
                .slice(0, 4);

            const allApts = aRes.status === 'fulfilled' ? (aRes.value.appointments || []) : [];
            const appointments = allApts
                .filter(a =>
                    a.reason?.toLowerCase().includes(q.toLowerCase()) ||
                    a.patientName?.toLowerCase().includes(q.toLowerCase()) ||
                    a.doctorName?.toLowerCase().includes(q.toLowerCase())
                )
                .slice(0, 4);

            setResults({ patients, doctors, appointments });
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    };

    const handleSelect = (type, item) => {
        setOpen(false);
        setQuery('');
        if (type === 'patient') navigate(`/emr?patientId=${item.userId || item.id}`);
        else if (type === 'doctor') navigate(`/doctors`);
        else if (type === 'appointment') navigate(`/appointments`);
    };

    const total = results.patients.length + results.doctors.length + results.appointments.length;

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger button */}
            <button
                onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="hidden md:flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 min-w-[220px] text-slate-400 text-sm hover:bg-slate-200 transition-colors"
            >
                <Search size={16} />
                <span className="flex-1 text-left">Search...</span>
                <kbd className="text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
            </button>

            {/* Mobile trigger */}
            <button onClick={() => setOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
                <Search size={20} className="text-slate-500" />
            </button>

            {/* Overlay */}
            {open && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
                    <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                            <Search size={18} className="text-slate-400 shrink-0" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search patients, doctors, appointments..."
                                className="flex-1 text-sm outline-none text-slate-800 placeholder-slate-400"
                                autoFocus
                            />
                            {loading && <CircularProgress size={16} />}
                            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="max-h-96 overflow-y-auto">
                            {query.length < 2 ? (
                                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                                    Type at least 2 characters to search
                                </div>
                            ) : total === 0 && !loading ? (
                                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                                    No results for "{query}"
                                </div>
                            ) : (
                                <>
                                    {results.patients.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">Patients</div>
                                            {results.patients.map(p => (
                                                <button key={p.id} onClick={() => handleSelect('patient', p)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                                                        {p.fullName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-800">{p.fullName}</div>
                                                        <div className="text-xs text-slate-400">{p.email} · #{(p.userId || p.id)?.slice(-6).toUpperCase()}</div>
                                                    </div>
                                                    <User size={14} className="ml-auto text-slate-300" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {results.doctors.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">Doctors</div>
                                            {results.doctors.map(d => (
                                                <button key={d.id} onClick={() => handleSelect('doctor', d)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm shrink-0">
                                                        {d.fullName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-800">{d.fullName}</div>
                                                        <div className="text-xs text-slate-400">{d.specialization}</div>
                                                    </div>
                                                    <Stethoscope size={14} className="ml-auto text-slate-300" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {results.appointments.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">Appointments</div>
                                            {results.appointments.map(a => (
                                                <button key={a.id} onClick={() => handleSelect('appointment', a)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                                        <CalendarDays size={14} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-800">{a.reason}</div>
                                                        <div className="text-xs text-slate-400">
                                                            {a.patientName || 'Patient'} · {a.appointmentDate} · {a.status}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
                            <span><kbd className="bg-slate-100 rounded px-1">↑↓</kbd> navigate</span>
                            <span><kbd className="bg-slate-100 rounded px-1">↵</kbd> select</span>
                            <span><kbd className="bg-slate-100 rounded px-1">Esc</kbd> close</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
