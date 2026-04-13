import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star, MapPin, Phone, ChevronLeft, Calendar, Clock,
    Video, Home, CheckCircle2, AlertCircle, Loader2,
    GraduationCap, Languages, Briefcase, Award, MessageSquare
} from 'lucide-react';
import doctorService from '../../api/doctor.service';
import appointmentService from '../../api/appointment.service';

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
        });
    }
    return days;
}

// ─── Timeline Item ────────────────────────────────────────────────────────────
function TimelineItem({ title, subtitle, year }) {
    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-teal-500 mt-1 shrink-0" />
                <div className="w-0.5 flex-1 bg-teal-100 mt-1" />
            </div>
            <div className="pb-5">
                <p className="font-bold text-slate-800 text-sm">{title}</p>
                <p className="text-slate-500 text-sm">{subtitle}</p>
                {year && <p className="text-teal-600 text-xs font-semibold mt-0.5">{year}</p>}
            </div>
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

    // Booking state
    const [bookingType, setBookingType] = useState(null); // 'clinic' | 'video' | null
    const [selectedDate, setSelectedDate] = useState(getNext7Days()[0].date);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedTime, setSelectedTime] = useState(null);
    const [reason, setReason] = useState('');
    const [booking, setBooking] = useState(false);
    const [success, setSuccess] = useState(false);
    const [bookingError, setBookingError] = useState('');

    const days = getNext7Days();

    // Fetch doctor
    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                // Try public endpoint first, fall back to authenticated
                let data;
                try {
                    const res = await doctorService.getPublicDoctors({ search: '' });
                    const found = (res.doctors || res.records || []).find(d => d.id === doctorId);
                    if (found) { data = found; }
                } catch (_) {}
                if (!data) {
                    data = await doctorService.getDoctorById(doctorId);
                }
                setDoctor(data);
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [doctorId]);

    // Fetch slots when date changes and booking type is clinic
    useEffect(() => {
        if (bookingType !== 'clinic' || !selectedDate) return;
        const fetchSlots = async () => {
            try {
                setLoadingSlots(true);
                setSelectedTime(null);
                const data = await appointmentService.getAvailability(doctorId, selectedDate);
                setSlots(data.slots || []);
            } catch {
                setSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [selectedDate, bookingType, doctorId]);

    const handleBookingTypeClick = (type) => {
        if (!user) {
            navigate(`/login?redirect=/doctor/${doctorId}`);
            return;
        }
        if (type === 'video') {
            navigate(`/book/${doctorId}?type=video`);
            return;
        }
        setBookingType(bookingType === type ? null : type);
        setBookingError('');
        setSelectedTime(null);
    };

    const handleConfirmBooking = async () => {
        if (!selectedTime || !reason.trim()) return;
        setBooking(true);
        setBookingError('');
        try {
            await appointmentService.createAppointment({
                doctorId,
                appointmentDate: selectedDate,
                appointmentTime: selectedTime.timeValue,
                reason,
                type: 'clinic',
            });
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 3000);
        } catch (err) {
            setBookingError(err.response?.data?.message || 'Booking failed. Please try again.');
        } finally {
            setBooking(false);
        }
    };

    // Mock overview data (uses real doctor fields where available)
    const education = doctor ? [
        {
            title: doctor.qualification || 'Doctor of Medicine (MD)',
            subtitle: 'Addis Ababa University',
            year: '2015',
        },
        {
            title: `Residency — ${doctor.specialization || 'General Medicine'}`,
            subtitle: 'Black Lion Specialized Hospital',
            year: '2018',
        },
    ] : [];

    const experience = doctor ? [
        {
            title: 'Biruh Tena Specialty Center',
            subtitle: doctor.specialization || 'Specialist',
            year: '2019 – Present',
        },
    ] : [];

    const languages = ['Amharic', 'English'];

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

    const fee = doctor?.consultationFee ? `ETB ${doctor.consultationFee}` : 'ETB 500';

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

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

                {/* ── Doctor Header Card ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Photo */}
                        <div className="shrink-0">
                            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md bg-teal-50">
                                {doctor?.profilePhoto ? (
                                    <img src={doctor.profilePhoto} alt={doctor.fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-4xl font-black text-teal-300"
                                            style={{ fontFamily: "'Playfair Display', serif" }}>
                                            {doctor?.fullName?.charAt(0) || 'D'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-black text-slate-900 mb-1">{doctor?.fullName}</h1>

                            {/* Rating */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                    <Star size={13} className="text-amber-500 fill-amber-500" />
                                    <span className="text-sm font-bold text-amber-700">{doctor?.rating || '0'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-500 text-sm">
                                    <MessageSquare size={13} />
                                    <span>{doctor?.reviewsCount || 0} Reviews</span>
                                </div>
                            </div>

                            {/* Specialization badge */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full border border-teal-100">
                                    {doctor?.specialization || 'General Medicine'}
                                </span>
                                {doctor?.qualification && (
                                    <span className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-semibold rounded-full border border-slate-100">
                                        {doctor.qualification}
                                    </span>
                                )}
                            </div>

                            {/* Location & Contact */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <MapPin size={14} className="text-teal-500 shrink-0" />
                                    <span>Biruh Tena Specialty Center · Bole, Addis Ababa</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <Phone size={14} className="text-teal-500 shrink-0" />
                                    <span>+251 911 22 33 44</span>
                                </div>
                            </div>
                        </div>

                        {/* Booking Buttons */}
                        <div className="flex flex-row sm:flex-col gap-3 shrink-0">
                            {/* Clinic Visit */}
                            <button
                                onClick={() => handleBookingTypeClick('clinic')}
                                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all border-2 min-w-[180px] ${
                                    bookingType === 'clinic'
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                }`}
                            >
                                <div className={`p-1.5 rounded-lg ${bookingType === 'clinic' ? 'bg-white/20' : 'bg-amber-100'}`}>
                                    <Home size={16} className={bookingType === 'clinic' ? 'text-white' : 'text-amber-600'} />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-sm leading-tight">Book Clinic Visit</p>
                                    <p className={`text-xs ${bookingType === 'clinic' ? 'text-white/80' : 'text-amber-600'}`}>
                                        {fee} / 15 Min
                                    </p>
                                </div>
                            </button>

                            {/* Video Consultation */}
                            <button
                                onClick={() => handleBookingTypeClick('video')}
                                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all border-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 min-w-[180px]"
                            >
                                <div className="p-1.5 rounded-lg bg-emerald-100">
                                    <Video size={16} className="text-emerald-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-sm leading-tight">Book Video Consultation</p>
                                    <p className="text-xs text-emerald-600">{fee} / 20 Min</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Clinic Booking Panel ── */}
                <AnimatePresence>
                    {bookingType === 'clinic' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <Home size={18} className="text-amber-500" />
                                    <h3 className="font-black text-slate-900">In-Clinic Visit Time Slots</h3>
                                </div>

                                {/* Date Picker */}
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                                    {days.map((d) => (
                                        <button
                                            key={d.date}
                                            onClick={() => setSelectedDate(d.date)}
                                            className={`shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all min-w-[72px] ${
                                                selectedDate === d.date
                                                    ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/20'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                                            }`}
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{d.label}</span>
                                            <span className="text-xl font-black leading-tight">{d.day}</span>
                                            <span className="text-[10px] opacity-70">{d.month}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Time Slots */}
                                {loadingSlots ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                                    </div>
                                ) : slots.length > 0 ? (
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
                                        {slots.map((slot) => (
                                            <button
                                                key={slot.timeValue}
                                                type="button"
                                                disabled={!slot.available}
                                                onClick={() => setSelectedTime(slot)}
                                                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                                                    !slot.available
                                                        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                                        : selectedTime?.timeValue === slot.timeValue
                                                            ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600'
                                                }`}
                                            >
                                                {slot.time}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl mb-6">
                                        <Clock size={28} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-slate-400 text-sm font-medium">No slots available for this date.</p>
                                    </div>
                                )}

                                {/* Reason */}
                                <div className="mb-5">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        Reason for Visit
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="e.g., Routine checkup, follow-up visit..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                                    />
                                </div>

                                {bookingError && (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
                                        <AlertCircle size={16} />
                                        {bookingError}
                                    </div>
                                )}

                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={!selectedTime || !reason.trim() || booking}
                                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${
                                        !selectedTime || !reason.trim() || booking
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20'
                                    }`}
                                >
                                    {booking ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 size={16} className="animate-spin" /> Confirming...
                                        </span>
                                    ) : 'Confirm Clinic Appointment'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Tabs ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Tab Headers */}
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
                                    <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-8"
                                >
                                    {/* Bio */}
                                    {doctor?.bio && (
                                        <div>
                                            <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                                                <div className="w-1 h-5 bg-teal-500 rounded-full" />
                                                About
                                            </h4>
                                            <p className="text-slate-600 text-sm leading-relaxed">{doctor.bio}</p>
                                        </div>
                                    )}

                                    {/* Education */}
                                    <div>
                                        <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                            <GraduationCap size={18} className="text-teal-600" />
                                            Education
                                        </h4>
                                        <div>
                                            {education.map((e, i) => (
                                                <TimelineItem key={i} title={e.title} subtitle={e.subtitle} year={e.year} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Languages */}
                                    <div>
                                        <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                                            <Languages size={18} className="text-teal-600" />
                                            Spoken Languages
                                        </h4>
                                        <div className="flex gap-2 flex-wrap">
                                            {languages.map((lang) => (
                                                <div key={lang} className="flex items-center gap-2 text-slate-600 text-sm">
                                                    <div className="w-2 h-2 rounded-full bg-teal-400" />
                                                    {lang}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Work & Experience */}
                                    <div>
                                        <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                            <Briefcase size={18} className="text-teal-600" />
                                            Work & Experience
                                        </h4>
                                        <div>
                                            {experience.map((e, i) => (
                                                <TimelineItem key={i} title={e.title} subtitle={e.subtitle} year={e.year} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Awards */}
                                    <div>
                                        <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                            <Award size={18} className="text-teal-600" />
                                            Awards
                                        </h4>
                                        <div className="flex items-center gap-3 text-slate-500 text-sm bg-slate-50 rounded-xl p-4">
                                            <div className="w-2 h-2 rounded-full bg-teal-400" />
                                            {doctor?.experience
                                                ? `${doctor.experience}+ years of clinical excellence`
                                                : 'Board-certified specialist with clinical excellence'}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'reviews' && (
                                <motion.div
                                    key="reviews"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {doctor?.reviewsCount > 0 ? (
                                        <div className="space-y-4">
                                            {/* Placeholder review */}
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-black">P</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">Patient</p>
                                                        <div className="flex gap-0.5">
                                                            {[1,2,3,4,5].map(s => (
                                                                <Star key={s} size={11} className="text-amber-400 fill-amber-400" />
                                                            ))}
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
        </div>
    );
}
