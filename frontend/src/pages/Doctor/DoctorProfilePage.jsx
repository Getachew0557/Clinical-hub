import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star, MapPin, Phone, ChevronLeft, Calendar, Clock,
    Video, Home, CheckCircle2, AlertCircle, Loader2,
    GraduationCap, Languages, Briefcase, Award, MessageSquare,
    Users, X, Eye, EyeOff
} from 'lucide-react';
import doctorService from '../../api/doctor.service';
import appointmentService from '../../api/appointment.service';
import { login, register, reset } from '../../store/slices/authSlice';
import { getDoctorPhotoUrl } from '../../utils/cn';

// ─── Inline Auth Modal ────────────────────────────────────────────────────────
function AuthModal({ onClose, onSuccess }) {
    const dispatch = useDispatch();
    const { isLoading, isError, isSuccess, message, user } = useSelector(s => s.auth);
    const [tab, setTab] = useState('login'); // 'login' | 'register'
    const [showPw, setShowPw] = useState(false);
    const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });

    // When auth succeeds, call onSuccess
    useEffect(() => {
        if (isSuccess && user) {
            dispatch(reset());
            onSuccess(user);
        }
    }, [isSuccess, user]);

    const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = e => {
        e.preventDefault();
        if (tab === 'login') {
            dispatch(login({ email: form.email, password: form.password }));
        } else {
            dispatch(register({ fullName: form.fullName, email: form.email, password: form.password, phone: form.phone, role: 'Patient' }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">
                            {tab === 'login' ? 'Sign in to confirm booking' : 'Create account to book'}
                        </h2>
                        <p className="text-slate-500 text-xs mt-0.5">Your slot selection is saved</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    {['login', 'register'].map(t => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); dispatch(reset()); }}
                            className={`flex-1 py-3 text-sm font-bold capitalize transition-all relative ${
                                tab === t ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {t === 'login' ? 'Sign In' : 'Register'}
                            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {isError && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                            <AlertCircle size={15} />
                            {message || 'Authentication failed. Please try again.'}
                        </div>
                    )}

                    {tab === 'register' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                                <input name="fullName" required value={form.fullName} onChange={handleChange}
                                    placeholder="Abebe Kebede"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Phone (optional)</label>
                                <input name="phone" value={form.phone} onChange={handleChange}
                                    placeholder="+251 9XX XX XX XX"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
                        <input name="email" type="email" required value={form.email} onChange={handleChange}
                            placeholder="name@email.com"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
                        <div className="relative">
                            <input name="password" type={showPw ? 'text' : 'password'} required value={form.password} onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 pr-11" />
                            <button type="button" onClick={() => setShowPw(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading}
                        className="w-full py-3.5 bg-teal-600 text-white rounded-2xl font-black text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed">
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 size={16} className="animate-spin" />
                                {tab === 'login' ? 'Signing in...' : 'Creating account...'}
                            </span>
                        ) : tab === 'login' ? 'Sign In & Confirm Booking' : 'Register & Confirm Booking'}
                    </button>

                    <p className="text-center text-xs text-slate-400">
                        {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button type="button" onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); dispatch(reset()); }}
                            className="text-teal-600 font-bold hover:underline">
                            {tab === 'login' ? 'Register' : 'Sign In'}
                        </button>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNext7Days() {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push({
            label: dayNames[d.getDay()],
            date: d.toISOString().split('T')[0],
            day: d.getDate(),
            month: monthNames[d.getMonth()],
            dayName: dayNames[d.getDay()], // full day name for working days check
        });
    }
    return days;
}

// Filter days to only show doctor's working days
function getAvailableDays(doctor) {
    const all = getNext7Days();
    if (!doctor) return all;
    let workingDays = doctor.workingDays;
    if (typeof workingDays === 'string') {
        try { workingDays = JSON.parse(workingDays); } catch { workingDays = null; }
    }
    if (!workingDays || !Array.isArray(workingDays) || workingDays.length === 0) return all;
    // workingDays is like ['Monday','Tuesday',...]
    const fullDayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return all.filter(d => workingDays.includes(fullDayNames[new Date(d.date).getDay()]));
}

// ─── Timeline Item ────────────────────────────────────────────────────────────
function TimelineItem({ title, subtitle, year, icon: Icon }) {
    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 shrink-0">
                    {Icon ? <Icon size={20} /> : <div className="w-2 h-2 rounded-full bg-teal-500" />}
                </div>
                <div className="w-0.5 flex-1 bg-teal-100/50 my-2" />
            </div>
            <div className="pb-8 pt-1">
                <p className="font-extrabold text-slate-900 text-sm mb-0.5">{title}</p>
                <p className="text-slate-500 text-sm font-medium">{subtitle}</p>
                {year && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-black mt-2 border border-teal-200/50 uppercase tracking-tighter">
                        <Clock size={10} /> {year}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Patient Autocomplete ─────────────────────────────────────────────────────
function PatientAutocomplete({ patients, value, onChange }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = React.useRef(null);

    const selected = patients.find(p => (p.userId || p.id) === value);

    const filtered = query.trim()
        ? patients.filter(p =>
            (p.fullName || '').toLowerCase().includes(query.toLowerCase()) ||
            (p.email || '').toLowerCase().includes(query.toLowerCase())
          )
        : patients;

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (p) => {
        onChange(p.userId || p.id);
        setQuery(p.fullName);
        setOpen(false);
    };

    const handleClear = () => {
        onChange('');
        setQuery('');
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={selected && !open ? selected.fullName : query}
                    onChange={e => { setQuery(e.target.value); setOpen(true); onChange(''); }}
                    onFocus={() => setOpen(true)}
                    placeholder="Type patient name to search..."
                    className={`w-full px-4 py-2.5 pr-10 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all ${
                        value ? 'border-teal-400 bg-teal-50' : 'border-slate-200'
                    }`}
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto"
                    >
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-slate-400 text-sm text-center">
                                {query ? 'No patients found' : 'Start typing to search...'}
                            </div>
                        ) : (
                            filtered.slice(0, 20).map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSelect(p)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50 transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-black text-xs shrink-0">
                                        {(p.fullName || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{p.fullName}</p>
                                        {p.email && <p className="text-xs text-slate-400 truncate">{p.email}</p>}
                                    </div>
                                </button>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── SlotPicker Sub-Component ─────────────────────────────────────────────────
function SlotPicker({ type, doctorId, user, navigate, onBooked, doctor }) {
    const isClinic = type === 'clinic';
    const isStaff = user && ['Admin', 'Receptionist'].includes(user.role);
    const days = getAvailableDays(doctor);

    const [open, setOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(days[0].date);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedTime, setSelectedTime] = useState(null);
    const [reason, setReason] = useState('');
    const [booking, setBooking] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState('');

    const doctorHospitals = doctor?.hospitals ? (Array.isArray(doctor.hospitals) ? doctor.hospitals : (() => { try { return JSON.parse(doctor.hospitals); } catch { return []; } })()) : [];

    // Staff patient selection
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [loadingPatients, setLoadingPatients] = useState(false);

    const fee = isClinic
        ? (doctor?.consultationFee ? `ETB ${doctor.consultationFee}` : 'ETB 500')
        : (doctor?.videoFee ? `ETB ${doctor.videoFee}` : doctor?.consultationFee ? `ETB ${doctor.consultationFee}` : 'ETB 500');

    // Fetch slots when date changes (clinic only)
    useEffect(() => {
        if (!open || !isClinic) return;
        const fetchSlots = async () => {
            try {
                setLoadingSlots(true);
                setSelectedTime(null);
                // Use the doctor's auth userId for availability lookup (matches appointment doctorId)
                const availDoctorId = doctor?.userId || doctorId;
                const data = await appointmentService.getAvailability(availDoctorId, selectedDate, 'clinic');
                setSlots(data.slots || []);
            } catch {
                setSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [selectedDate, open, isClinic, doctorId]);

    // Load patients list for staff roles when panel opens
    useEffect(() => {
        if (!open || !isStaff || patients.length > 0) return;
        const fetchPatients = async () => {
            try {
                setLoadingPatients(true);
                const patientService = (await import('../../api/patient.service')).default;
                const data = await patientService.getAllPatients();
                setPatients(data.patients || []);
            } catch {
                setPatients([]);
            } finally {
                setLoadingPatients(false);
            }
        };
        fetchPatients();
    }, [open, isStaff]);

    const handleButtonClick = () => {
        if (!isClinic) {
            // Video: require login first
            if (!user) {
                navigate(`/login?redirect=/doctor/${doctorId}`);
                return;
            }
            navigate(`/book/${doctorId}?type=video`);
            return;
        }
        // Clinic: always allow opening to browse slots
        setOpen((prev) => !prev);
        setBookingError('');
        setSelectedTime(null);
    };

    const doBooking = async (overrideUser) => {
        const currentUser = overrideUser || user;
        if (!selectedTime || !reason.trim() || !currentUser) return;

        // Determine patientId:
        // - Patient role → their own ID
        // - Admin/Receptionist → must select a patient
        const isCurrentUserStaff = ['Admin', 'Receptionist'].includes(currentUser.role);
        const patientId = isCurrentUserStaff ? selectedPatientId : currentUser.id;

        if (isCurrentUserStaff && !patientId) {
            setBookingError('Please select a patient to book for.');
            return;
        }

        // Use the doctor's auth userId for the appointment (not the profile ID)
        const appointmentDoctorId = doctor?.userId || doctorId;

        setBooking(true);
        setBookingError('');
        try {
            await appointmentService.createAppointment({
                doctorId: appointmentDoctorId,
                patientId,
                appointmentDate: selectedDate,
                appointmentTime: selectedTime.timeValue,
                reason,
                type: 'clinic',
                hospitalName: selectedHospital,
            });
            setOpen(false);
            if (onBooked) onBooked();
        } catch (err) {
            setBookingError(err.response?.data?.message || 'Booking failed. Please try again.');
        } finally {
            setBooking(false);
        }
    };

    const handleConfirm = () => {
        if (!selectedTime || !reason.trim()) return;
        if (isClinic && doctorHospitals.length > 0 && !selectedHospital) {
            setBookingError('Please select a hospital location.');
            return;
        }
        if (!user) {
            // Show inline auth modal — slot selection is preserved
            setShowAuthModal(true);
            return;
        }
        doBooking();
    };

    // Called after successful login/register from the modal
    const handleAuthSuccess = (loggedInUser) => {
        setShowAuthModal(false);
        doBooking(loggedInUser);
    };

    // Slot remaining color — backend returns `remainingSpots`
    const remainingColor = (slot) => {
        const left = slot.remainingSpots !== undefined ? slot.remainingSpots : (slot.remaining !== undefined ? slot.remaining : 0);
        if (!slot.available || left === 0) return 'text-red-500';
        if (left <= 2) return 'text-orange-500';
        return 'text-emerald-600';
    };

    const remainingLabel = (slot) => {
        const left = slot.remainingSpots !== undefined ? slot.remainingSpots : (slot.remaining !== undefined ? slot.remaining : 0);
        if (!slot.available || left === 0) return 'Full';
        return `${left} left`;
    };

    // Button styles
    const btnBase = 'flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all border-2 w-full';
    const clinicActive = 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20';
    const clinicIdle = 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
    const videoStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';

    return (
        <div className="w-full">
            {/* Auth Modal */}
            <AnimatePresence>
                {showAuthModal && (
                    <AuthModal
                        onClose={() => setShowAuthModal(false)}
                        onSuccess={handleAuthSuccess}
                    />
                )}
            </AnimatePresence>
            {/* Trigger Button */}
            <button
                onClick={handleButtonClick}
                className={`${btnBase} ${isClinic ? (open ? clinicActive : clinicIdle) : videoStyle}`}
            >
                <div className={`p-1.5 rounded-lg ${
                    isClinic
                        ? (open ? 'bg-white/20' : 'bg-amber-100')
                        : 'bg-emerald-100'
                }`}>
                    {isClinic
                        ? <Home size={16} className={open ? 'text-white' : 'text-amber-600'} />
                        : <Video size={16} className="text-emerald-600" />
                    }
                </div>
                <div className="text-left">
                    <p className="font-black text-sm leading-tight">
                        {isClinic ? 'Book Clinic Visit' : 'Book Video Consultation'}
                    </p>
                    <p className={`text-xs ${
                        isClinic
                            ? (open ? 'text-white/80' : 'text-amber-600')
                            : 'text-emerald-600'
                    }`}>
                        {fee} / {isClinic ? '15' : '20'} Min
                    </p>
                </div>
            </button>

            {/* Inline Slot Picker (clinic only) */}
            <AnimatePresence>
                {isClinic && open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar size={16} className="text-amber-600" />
                                <span className="font-black text-slate-800 text-sm">Select Date & Time</span>
                            </div>

                            {/* Hospital Selection */}
                            {isClinic && doctorHospitals.length > 0 && (
                                <div className="mb-5">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        Select Hospital
                                    </label>
                                    <select
                                        value={selectedHospital}
                                        onChange={(e) => setSelectedHospital(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
                                    >
                                        <option value="">-- Select a Hospital --</option>
                                        {doctorHospitals.map((h, i) => (
                                            <option key={i} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* 7-Day Date Picker */}
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
                                {days.map((d) => (
                                    <button
                                        key={d.date}
                                        onClick={() => setSelectedDate(d.date)}
                                        className={`shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl border-2 transition-all min-w-[60px] ${
                                            selectedDate === d.date
                                                ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/20'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                                        }`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-tighter opacity-80">{d.label}</span>
                                        <span className="text-lg font-black leading-tight">{d.day}</span>
                                        <span className="text-xs font-bold opacity-70">{d.month}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Time Slots Grid */}
                            {loadingSlots ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                                </div>
                            ) : slots.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2.5 mb-6">
                                    {slots.map((slot) => {
                                        const leftValue = slot.remainingSpots !== undefined ? slot.remainingSpots : (slot.remaining !== undefined ? slot.remaining : 0);
                                        const isFull = !slot.available || leftValue === 0;
                                        const isSelected = selectedTime?.timeValue === slot.timeValue;
                                        return (
                                            <button
                                                key={slot.timeValue}
                                                type="button"
                                                disabled={isFull}
                                                onClick={() => setSelectedTime(slot)}
                                                className={`flex flex-col items-center py-3 px-1 rounded-2xl text-xs font-black transition-all border-2 ${
                                                    isFull
                                                        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-teal-600 text-white border-teal-600 shadow-xl shadow-teal-600/30'
                                                            : 'bg-white text-slate-800 border-slate-100 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/30'
                                                }`}
                                            >
                                                <span className="text-sm">{slot.time}</span>
                                                <span className={`text-xs font-black uppercase tracking-tighter mt-1 ${
                                                    isSelected ? 'text-white/80' : remainingColor(slot)
                                                }`}>
                                                    {/* Only show remaining count if at least 1 spot is booked */}
                                                    {slot.bookedCount > 0 ? remainingLabel(slot) : ''}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-white/50 border-2 border-dashed border-slate-100 rounded-2xl mb-6">
                                    <Clock size={32} className="mx-auto text-slate-300 mb-2" strokeWidth={1.5} />
                                    <p className="text-slate-400 text-sm font-bold">No slots available</p>
                                    <p className="text-slate-400 text-xs font-semibold">Try selecting another date</p>
                                </div>
                            )}

                            {/* Patient Selector — Staff only */}
                            {isStaff && (
                                <div className="mb-4 relative">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        Select Patient
                                    </label>
                                    {loadingPatients ? (
                                        <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                                            <Loader2 size={14} className="animate-spin" /> Loading patients...
                                        </div>
                                    ) : (
                                        <PatientAutocomplete
                                            patients={patients}
                                            value={selectedPatientId}
                                            onChange={setSelectedPatientId}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Reason Textarea */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Reason for Visit
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g., Routine checkup, follow-up visit..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                                />
                            </div>

                            {bookingError && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
                                    <AlertCircle size={16} />
                                    {bookingError}
                                </div>
                            )}

                            {/* Confirm Button */}
                            <button
                                onClick={handleConfirm}
                                disabled={!selectedTime || !reason.trim() || booking || (isStaff && !selectedPatientId)}
                                className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all ${
                                    !selectedTime || !reason.trim() || booking || (isStaff && !selectedPatientId)
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : user
                                            ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20'
                                            : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20'
                                }`}
                            >
                                {booking ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={16} className="animate-spin" /> Confirming...
                                    </span>
                                ) : user ? 'Confirm Clinic Appointment' : 'Sign In to Confirm Booking'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DoctorProfilePage() {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [success, setSuccess] = useState(false);

    // Fetch doctor — use public endpoint first (no auth needed), fall back to authenticated for staff
    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                setLoading(true);
                let data = null;

                // Try public endpoint first — works for everyone without auth issues
                try {
                    const res = await doctorService.getPublicDoctors({ search: '' });
                    const found = (res.doctors || res.records || []).find(d => d.id === doctorId);
                    if (found) data = found;
                } catch (_) {}

                // If not found in public list (e.g. inactive doctor viewed by admin), try authenticated
                if (!data && user && ['Admin', 'Receptionist'].includes(user?.role)) {
                    try {
                        data = await doctorService.getDoctorById(doctorId);
                    } catch (_) {}
                }

                if (!data) {
                    setNotFound(true);
                } else {
                    setDoctor(data);
                }
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctor();
    }, [doctorId, user]);

    // Use real doctor data, fall back to sensible defaults
    const education = doctor?.education
        ? (Array.isArray(doctor.education) ? doctor.education : JSON.parse(doctor.education))
        : [
            { title: doctor?.qualification || 'Doctor of Medicine (MD)', subtitle: 'Addis Ababa University', year: '2015', icon: GraduationCap },
            { title: `Residency — ${doctor?.specialization || 'General Medicine'}`, subtitle: 'Black Lion Specialized Hospital', year: '2018', icon: Award },
          ];

    const experience = doctor?.workExperience
        ? (Array.isArray(doctor.workExperience) ? doctor.workExperience : JSON.parse(doctor.workExperience))
        : [{ title: 'Biruh Tena Specialty Center', subtitle: doctor?.specialization || 'Specialist', year: '2019 – Present', icon: Briefcase }];

    const languages = doctor?.languages
        ? (Array.isArray(doctor.languages) ? doctor.languages : JSON.parse(doctor.languages))
        : ['Amharic', 'English'];

    const awardsArr = doctor?.awards ? (Array.isArray(doctor.awards) ? doctor.awards : (() => { try { return JSON.parse(doctor.awards); } catch { return []; } })()) : [];

    const serviceTypes = doctor?.serviceTypes
        ? (Array.isArray(doctor.serviceTypes) ? doctor.serviceTypes : JSON.parse(doctor.serviceTypes))
        : ['clinic', 'video'];

    // ── Loading ──
    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        </div>
    );

    // ── Not Found ──
    if (notFound) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Doctor Not Found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all">
                    Go Back
                </button>
            </div>
        </div>
    );

    // ── Success ──
    if (success) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Appointment Confirmed!</h2>
                <p className="text-slate-500 mb-6">Your appointment with {doctor?.fullName} has been scheduled.</p>
                <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all">
                    Go to Dashboard
                </button>
            </motion.div>
        </div>
    );

    const maxPPH = doctor?.maxPatientsPerHour || 10;

    return (
        <div className="min-h-screen bg-slate-100">
            {/* ── Top Bar ── */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-slate-500 hover:text-teal-600 font-semibold text-sm transition-colors group"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm font-semibold text-slate-700 truncate">{doctor?.fullName}</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* ── Two-column layout: left = info+tabs, right = booking panel ── */}
                <div className="flex flex-col lg:flex-row gap-5 items-start">

                    {/* ── LEFT COLUMN: Doctor info + Tabs ── */}
                    <div className="flex-1 min-w-0 space-y-4">

                        {/* Doctor Info Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex gap-5">
                                {/* Photo */}
                                <div className="shrink-0">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md bg-teal-50">
                                        {getDoctorPhotoUrl(doctor?.profilePhoto) ? (
                                            <img src={getDoctorPhotoUrl(doctor.profilePhoto)} alt={doctor.fullName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-4xl font-extrabold text-teal-300">
                                                    {doctor?.fullName?.charAt(0) || 'D'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl font-black text-slate-900 mb-1">{doctor?.fullName}</h1>

                                    {/* Rating row */}
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                                            <Star size={12} className="text-amber-500 fill-amber-500" />
                                            <span className="text-xs font-bold text-amber-700">{doctor?.rating || '0'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                                            <MessageSquare size={12} />
                                            <span>{doctor?.reviewsCount || 0} Reviews</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-lg">
                                            <Users size={11} className="text-teal-600" />
                                            <span className="text-xs font-bold text-teal-700">{maxPPH} patients/hr</span>
                                        </div>
                                    </div>

                                    {/* Specialization badges */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full border border-teal-100">
                                            {doctor?.specialization || 'General Medicine'}
                                        </span>
                                        {doctor?.qualification && (
                                            <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs font-semibold rounded-full border border-slate-100">
                                                {doctor.qualification}
                                            </span>
                                        )}
                                    </div>

                                    {/* Contact */}
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <MapPin size={13} className="text-teal-500 shrink-0" />
                                            <span>Biruh Tena Specialty Center · Bole, Addis Ababa</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Phone size={13} className="text-teal-500 shrink-0" />
                                            <span>+251 911 22 33 44</span>
                                        </div>
                                        {doctor?.workingHoursStart && doctor?.workingHoursEnd && (
                                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                <Clock size={13} className="text-teal-500 shrink-0" />
                                                <span>{doctor.workingHoursStart.slice(0,5)} – {doctor.workingHoursEnd.slice(0,5)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Tabs ── */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="flex border-b border-slate-100">
                                {['overview', 'reviews'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-4 text-sm font-bold capitalize transition-all relative ${
                                            activeTab === tab ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        {activeTab === tab && (
                                            <motion.div layoutId="tab-indicator"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'overview' && (
                                        <motion.div key="overview"
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                                            className="space-y-8">
                                            {/* Bio — only if doctor.bio exists */}
                                            {doctor?.bio && (
                                                <div>
                                                    <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                                                        <div className="w-1 h-5 bg-teal-500 rounded-full" />About
                                                    </h4>
                                                    <p className="text-slate-600 text-sm leading-relaxed">{doctor.bio}</p>
                                                </div>
                                            )}
                                            {/* Education — only if education array has items */}
                                            {education.length > 0 && (
                                                <div>
                                                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                                        <GraduationCap size={18} className="text-teal-600" />Education
                                                    </h4>
                                                    {education.map((e, i) => <TimelineItem key={i} {...e} />)}
                                                </div>
                                            )}
                                            {/* Languages — only if languages array has items */}
                                            {languages.length > 0 && (
                                                <div>
                                                    <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                                                        <Languages size={18} className="text-teal-600" />Spoken Languages
                                                    </h4>
                                                    <div className="flex gap-4 flex-wrap">
                                                        {languages.map((lang) => (
                                                            <div key={lang} className="flex items-center gap-2 text-slate-600 text-sm">
                                                                <div className="w-2 h-2 rounded-full bg-teal-400" />{lang}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Work & Experience — only if experience array has items */}
                                            {experience.length > 0 && (
                                                <div>
                                                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                                        <Briefcase size={18} className="text-teal-600" />Work & Experience
                                                    </h4>
                                                    {experience.map((e, i) => <TimelineItem key={i} {...e} />)}
                                                </div>
                                            )}
                                            {/* Awards — only if awardsArr has items */}
                                            {awardsArr.length > 0 && (
                                                <div>
                                                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                                        <Award size={18} className="text-teal-600" />Awards
                                                    </h4>
                                                    {awardsArr.map((award, i) => (
                                                        <div key={i} className="flex items-center gap-3 text-slate-500 text-sm bg-slate-50 rounded-xl p-4 mb-2">
                                                            <div className="w-2 h-2 rounded-full bg-teal-400" />
                                                            {typeof award === 'string' ? award : award.title || award.name || JSON.stringify(award)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Empty state — only if nothing above rendered */}
                                            {!doctor?.bio && education.length === 0 && experience.length === 0 && languages.length === 0 && awardsArr.length === 0 && (
                                                <div className="text-center py-12">
                                                    <p className="text-slate-400 text-sm">No overview information available yet.</p>
                                                    {doctor?.experience && <p className="text-teal-600 text-sm font-bold mt-2">{doctor.experience}+ years of clinical experience</p>}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                    {activeTab === 'reviews' && (
                                        <motion.div key="reviews"
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                                            {doctor?.reviewsCount > 0 ? (
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-black">P</div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">Patient</p>
                                                                <div className="flex gap-0.5">
                                                                    {[1,2,3,4,5].map(s => <Star key={s} size={11} className="text-amber-400 fill-amber-400" />)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-slate-600 text-sm">Excellent doctor, very professional and caring.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-16">
                                                    <MessageSquare size={40} className="mx-auto text-slate-200 mb-3" />
                                                    <p className="text-slate-400 font-medium">No Reviews Yet</p>
                                                    <p className="text-slate-300 text-sm mt-1">Be the first to review this doctor.</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: Booking Panel (sticky) ── */}
                    <div className="w-full lg:w-[400px] shrink-0 lg:sticky lg:top-20 space-y-4">
                        {serviceTypes.includes('clinic') && (
                            <div className="bg-white rounded-3xl shadow-xl border border-white/40 p-1.5 ring-1 ring-slate-200/50">
                                <SlotPicker
                                    type="clinic"
                                    doctorId={doctorId}
                                    user={user}
                                    navigate={navigate}
                                    doctor={doctor}
                                    onBooked={() => setSuccess(true)}
                                />
                            </div>
                        )}
                        {serviceTypes.includes('video') && (
                            <div className="bg-white rounded-3xl shadow-xl border border-white/40 p-1.5 ring-1 ring-slate-200/50">
                                <SlotPicker
                                    type="video"
                                    doctorId={doctorId}
                                    user={user}
                                    navigate={navigate}
                                    doctor={doctor}
                                    onBooked={() => setSuccess(true)}
                                />
                            </div>
                        )}
                        {serviceTypes.length === 0 && (
                            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center">
                                <AlertCircle size={32} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-slate-400 text-sm font-bold">No booking options available</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
