import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    ChevronLeft,
    Star,
    User,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import doctorService from '../../api/doctor.service';
import appointmentService from '../../api/appointment.service';

const BookingPage = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();

    // States
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [slots, setSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState(null);
    const [reason, setReason] = useState('');
    const [booking, setBooking] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDoctor();
    }, [doctorId]);

    useEffect(() => {
        if (selectedDate) fetchAvailability();
    }, [selectedDate, doctorId]);

    const fetchDoctor = async () => {
        try {
            const data = await doctorService.getDoctorById(doctorId);
            setDoctor(data);
        } catch (err) {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailability = async () => {
        try {
            const data = await appointmentService.getAvailability(doctorId, selectedDate);
            setSlots(data.slots || []);
        } catch (err) {
            console.error('Availability fetch failed', err);
        }
    };

    const handleBook = async (e) => {
        e.preventDefault();
        if (!selectedTime) return;

        setBooking(true);
        setError('');

        try {
            await appointmentService.createAppointment({
                doctorId,
                appointmentDate: selectedDate,
                appointmentTime: selectedTime.timeValue,
                reason
            });
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed. Please try again.');
        } finally {
            setBooking(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
        </div>
    );

    if (notFound) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="max-w-md w-full glass p-10 rounded-[2.5rem] text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Doctor Not Found</h2>
                <p className="text-slate-500 font-medium mb-8">The doctor you're looking for is no longer available or the link may be incorrect.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-teal-600 transition-all"
                >
                    Go Back
                </button>
            </div>
        </div>
    );

    if (success) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full glass p-10 rounded-[2.5rem] text-center"
            >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Booking Confirmed!</h2>
                <p className="text-slate-500 font-medium mb-8">Your appointment with {doctor?.fullName} has been successfully scheduled.</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all"
                >
                    Go to Dashboard
                </button>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold mb-8 transition-colors group"
                >
                    <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    Back to Selection
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: Doctor Info */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass p-8 rounded-[2.5rem] sticky top-8"
                        >
                            <div className="relative w-32 h-32 rounded-3xl overflow-hidden mb-6 border-4 border-white shadow-xl">
                                <img
                                    src={doctor?.profilePhoto || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop"}
                                    className="w-full h-full object-cover"
                                    alt={doctor?.fullName}
                                />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 mb-2 leading-none">{doctor?.fullName}</h1>
                            <p className="text-teal-600 font-black mb-6">{doctor?.specialization}</p>

                            <div className="flex gap-4 mb-8">
                                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-1 text-yellow-500 mb-1">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="text-sm font-black text-slate-900">4.9</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase text-slate-400">Rating</p>
                                </div>
                                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <span className="text-sm font-black text-slate-900">{doctor?.experience || '5'}+ Yrs</span>
                                    <p className="text-[10px] font-black uppercase text-slate-400">Experience</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                                    <p className="text-slate-500 text-sm font-medium">Evidence-based clinical protocols</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                                    <p className="text-slate-500 text-sm font-medium">Multi-specialty care network</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Booking Form */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200"
                        >
                            <h2 className="text-2xl font-black text-slate-900 mb-8">Schedule Appointment</h2>

                            <form onSubmit={handleBook} className="space-y-8">
                                {/* Date Selection */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                                        <Calendar className="w-4 h-4" />
                                        Select Date
                                    </label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>

                                {/* Time Slots */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                                        <Clock className="w-4 h-4" />
                                        Available Slots
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {slots.map((slot) => (
                                            <button
                                                key={slot.timeValue}
                                                type="button"
                                                disabled={!slot.available}
                                                onClick={() => setSelectedTime(slot)}
                                                className={`
                                                    py-3 px-2 rounded-xl text-sm font-black transition-all border
                                                    ${!slot.available
                                                        ? 'bg-slate-50 text-slate-300 border-slate-50 cursor-not-allowed'
                                                        : selectedTime?.timeValue === slot.timeValue
                                                            ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-600/20 scale-105'
                                                            : 'bg-white text-slate-600 border-slate-100 hover:border-teal-600 hover:text-teal-600'
                                                    }
                                                `}
                                            >
                                                {slot.time}
                                                {slot.available && slot.remainingSpots === 1 && (
                                                    <span className="block text-[8px] mt-0.5 text-orange-500">Last Spot</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    {!slots.length && (
                                        <div className="p-8 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl">
                                            No slots available for this date.
                                        </div>
                                    )}
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                                        <User className="w-4 h-4" />
                                        Reason for Visit
                                    </label>
                                    <textarea
                                        required
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="e.g., Routine checkup, follow-up visit..."
                                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none min-h-[120px]"
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm font-bold">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!selectedTime || booking}
                                    className={`
                                        w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all
                                        ${!selectedTime || booking
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-900 text-white hover:bg-teal-600 shadow-xl'
                                        }
                                    `}
                                >
                                    {booking ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Confirming...
                                        </div>
                                    ) : 'Confirm Appointment'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
