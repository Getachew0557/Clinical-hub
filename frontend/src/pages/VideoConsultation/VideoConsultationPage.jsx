import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff,
    MessageSquare, Send, X, Wifi, WifiOff, Loader2,
    AlertCircle, Camera, CameraOff
} from 'lucide-react';
import appointmentService from '../../api/appointment.service';
import useVideoCall from './useVideoCall';
import { isParticipant, isVideoEligible } from './videoUtils';

// ─── Connection Status Badge ──────────────────────────────────────────────────
function StatusBadge({ status, t }) {
    const config = {
        idle: { color: 'bg-slate-500', label: t('videoConsult.connecting') },
        connecting: { color: 'bg-amber-500 animate-pulse', label: t('videoConsult.connecting') },
        connected: { color: 'bg-emerald-500', label: t('videoConsult.connected') },
        reconnecting: { color: 'bg-yellow-500 animate-pulse', label: t('videoConsult.reconnecting') },
        failed: { color: 'bg-red-500', label: t('videoConsult.disconnected') },
    };
    const cfg = config[status] || config.connecting;
    return (
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
            <span className="text-white text-xs font-semibold">{cfg.label}</span>
        </div>
    );
}

// ─── Control Button ───────────────────────────────────────────────────────────
function ControlBtn({ onClick, active, danger, children, title }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                danger
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : active
                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                        : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
            }`}
        >
            {children}
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VideoConsultationPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const { t } = useTranslation();

    const [appointment, setAppointment] = useState(null);
    const [accessError, setAccessError] = useState(null); // 'denied' | 'not-found' | 'not-eligible'
    const [loadingAppt, setLoadingAppt] = useState(true);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);

    const {
        localStream, remoteStream, connectionStatus,
        isMuted, isCameraOff, isChatOpen, setIsChatOpen,
        messages, unreadCount, setUnreadCount,
        permissionError, roomFull, peerLeft,
        toggleMute, toggleCamera, endCall, sendMessage, retryMedia,
    } = useVideoCall(accessError === null && !loadingAppt ? roomId : null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    // Fetch and verify appointment
    useEffect(() => {
        if (!roomId || !user) return;
        const verify = async () => {
            try {
                setLoadingAppt(true);
                const data = await appointmentService.getAppointmentById(roomId);
                const appt = data.appointment || data;
                if (!isParticipant(appt, user.id)) {
                    setAccessError('denied');
                } else if (!isVideoEligible(appt.status)) {
                    setAccessError('not-eligible');
                } else {
                    setAppointment(appt);
                }
            } catch (err) {
                setAccessError('not-found');
            } finally {
                setLoadingAppt(false);
            }
        };
        verify();
    }, [roomId, user]);

    // Attach streams to video elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Clear unread when chat opens
    useEffect(() => {
        if (isChatOpen) setUnreadCount(0);
    }, [isChatOpen, setUnreadCount]);

    const handleEndCall = () => {
        endCall();
        navigate('/appointments');
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim() || chatInput.length > 1000) return;
        sendMessage(chatInput.trim(), user?.fullName || t('videoConsult.you'));
        setChatInput('');
    };

    const remoteName = appointment
        ? (user?.role === 'Doctor' ? appointment.patientName : appointment.doctorName) || '...'
        : '...';

    // ── Loading ──
    if (loadingAppt) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
            </div>
        );
    }

    // ── Access Error ──
    if (accessError) {
        const messages_map = {
            denied: t('videoConsult.accessDenied'),
            'not-found': t('videoConsult.notFound'),
            'not-eligible': t('videoConsult.notEligible'),
        };
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-slate-800 rounded-3xl p-10 text-center">
                    <div className="w-16 h-16 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-3">{messages_map[accessError]}</h2>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-6 px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ── Permission Error ──
    if (permissionError) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-slate-800 rounded-3xl p-10 text-center">
                    <div className="w-16 h-16 bg-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Camera className="w-8 h-8 text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-3">{t('videoConsult.permissionError')}</h2>
                    <button
                        onClick={retryMedia}
                        className="mt-6 px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all"
                    >
                        {t('videoConsult.retry')}
                    </button>
                </div>
            </div>
        );
    }

    // ── Room Full ──
    if (roomFull) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-slate-800 rounded-3xl p-10 text-center">
                    <h2 className="text-xl font-bold text-white mb-3">{t('videoConsult.roomFull')}</h2>
                    <button onClick={() => navigate('/appointments')} className="mt-6 px-8 py-3 bg-teal-600 text-white rounded-xl font-bold">
                        Back to Appointments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex overflow-hidden">
            {/* ── Main Video Area ── */}
            <div className="flex-1 relative flex flex-col">
                {/* Remote Video */}
                <div className="flex-1 relative bg-slate-800">
                    {remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                            <div className="w-24 h-24 rounded-full bg-teal-700 flex items-center justify-center text-4xl font-black text-white">
                                {remoteName.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-white/70 text-sm font-medium">
                                {t('videoConsult.waitingFor', { name: remoteName })}
                            </p>
                        </div>
                    )}

                    {/* Remote name overlay */}
                    {remoteStream && (
                        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">
                            <span className="text-white text-sm font-semibold">{remoteName}</span>
                        </div>
                    )}

                    {/* Peer left banner */}
                    <AnimatePresence>
                        {peerLeft && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl"
                            >
                                {t('videoConsult.peerLeft')}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Local Video (PiP) */}
                <div className="absolute bottom-24 right-4 w-40 h-28 rounded-2xl overflow-hidden border-2 border-teal-500 shadow-2xl bg-slate-700">
                    {localStream && !isCameraOff ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-700">
                            <CameraOff className="text-slate-400 w-8 h-8" />
                        </div>
                    )}
                    <div className="absolute bottom-1 left-1 bg-black/50 px-2 py-0.5 rounded-lg">
                        <span className="text-white text-[10px] font-semibold">{t('videoConsult.you')}</span>
                    </div>
                </div>

                {/* Top Bar */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <StatusBadge status={connectionStatus} t={t} />
                    <div className="flex items-center gap-2">
                        {/* Chat toggle */}
                        <button
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className="relative bg-black/40 backdrop-blur-sm text-white p-2.5 rounded-full hover:bg-black/60 transition-all"
                        >
                            <MessageSquare size={20} />
                            {unreadCount > 0 && !isChatOpen && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <ControlBtn
                        onClick={toggleMute}
                        active={!isMuted}
                        title={isMuted ? t('videoConsult.unmute') : t('videoConsult.mute')}
                    >
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </ControlBtn>

                    <ControlBtn
                        onClick={toggleCamera}
                        active={!isCameraOff}
                        title={isCameraOff ? t('videoConsult.cameraOn') : t('videoConsult.cameraOff')}
                    >
                        {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
                    </ControlBtn>

                    <ControlBtn onClick={handleEndCall} danger title={t('videoConsult.endCall')}>
                        <PhoneOff size={22} />
                    </ControlBtn>
                </div>
            </div>

            {/* ── Chat Sidebar ── */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden"
                        style={{ minWidth: 0 }}
                    >
                        {/* Chat Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                            <span className="text-white font-bold text-sm">{t('videoConsult.chat')}</span>
                            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg) => {
                                const isOwn = msg.senderName === (user?.fullName || t('videoConsult.you'));
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                        <span className="text-slate-400 text-[10px] mb-1">
                                            {msg.senderName} · {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                                            isOwn
                                                ? 'bg-teal-600 text-white rounded-br-sm'
                                                : 'bg-slate-700 text-white rounded-bl-sm'
                                        }`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-700 flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder={t('videoConsult.typeMessage')}
                                maxLength={1000}
                                className="flex-1 bg-slate-700 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400"
                            />
                            <button
                                type="submit"
                                disabled={!chatInput.trim()}
                                className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-all"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                        {chatInput.length > 900 && (
                            <p className="text-xs text-amber-400 px-3 pb-2">{1000 - chatInput.length} chars remaining</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
