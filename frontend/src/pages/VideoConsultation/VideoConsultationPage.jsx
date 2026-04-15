import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff,
    MessageSquare, Send, X, Loader2,
    AlertCircle, CameraOff, Users
} from 'lucide-react';
import { Typography } from '@mui/material';
import appointmentService from '../../api/appointment.service';
import useVideoCall from './useVideoCall';
import { isVideoEligible } from './videoUtils';

function ControlBtn({ onClick, active, danger, children, title }) {
    return (
        <button onClick={onClick} title={title}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                danger
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : active
                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                        : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
            }`}>
            {children}
        </button>
    );
}

export default function VideoConsultationPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const { t } = useTranslation();

    const [appointment, setAppointment] = useState(null);
    const [accessError, setAccessError] = useState(null);
    const [loadingAppt, setLoadingAppt] = useState(true);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);

    const {
        localStream, remoteStream, connectionStatus,
        isMuted, isCameraOff,
        isRemoteMuted, isRemoteCameraOff,
        isChatOpen, setIsChatOpen,
        messages, unreadCount, setUnreadCount,
        permissionError, roomFull, peerLeft,
        toggleMute, toggleCamera, endCall, sendMessage, retryMedia,
        socketConnected,
    } = useVideoCall(accessError === null && !loadingAppt ? roomId : null);

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    const [statusUpdated, setStatusUpdated] = useState(false);

    useEffect(() => {
        if (user?.role === 'Doctor' && appointment?.status === 'Confirmed' && !statusUpdated) {
            appointmentService.updateStatus(roomId, 'In Progress')
                .then(() => setStatusUpdated(true))
                .catch(err => console.error('Failed to auto-update status:', err));
        }
    }, [user, appointment, roomId, statusUpdated]);

    useEffect(() => {
        if (!roomId || !user) return;
        const verify = async () => {
            try {
                setLoadingAppt(true);
                const data = await appointmentService.getAppointmentById(roomId);
                const appt = data.appointment || data;
                // Accept both doctorId and patientId — also check nested patientDetails
                const ids = [appt.doctorId, appt.patientId, appt.patientDetails?.userId, appt.patientDetails?.id].filter(Boolean);
                const allowed = ids.some(id => String(id) === String(user.id));
                if (!allowed) {
                    setAccessError('denied');
                } else if (!isVideoEligible(appt.status)) {
                    setAccessError('not-eligible');
                } else {
                    setAppointment(appt);
                }
            } catch {
                setAccessError('not-found');
            } finally {
                setLoadingAppt(false);
            }
        };
        verify();
    }, [roomId, user]);

    // Local video — callback ref sets srcObject immediately on mount
    const localVideoRef = useCallback((node) => {
        if (node && localStream) node.srcObject = localStream;
    }, [localStream]);

    // Remote video — keep a stable DOM ref + update srcObject via effect
    const remoteVideoNodeRef = useRef(null);
    const remoteVideoRef = useCallback((node) => {
        remoteVideoNodeRef.current = node;
        if (node && remoteStream) node.srcObject = remoteStream;
    }, [remoteStream]);

    useEffect(() => {
        if (remoteVideoNodeRef.current && remoteStream) {
            remoteVideoNodeRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isChatOpen) setUnreadCount(0);
    }, [isChatOpen, setUnreadCount]);

    const handleEndCall = () => { endCall(); navigate('/appointments'); };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim() || chatInput.length > 1000) return;
        sendMessage(chatInput.trim(), user?.fullName || 'You');
        setChatInput('');
    };

    const remoteName = appointment
        ? (user?.role === 'Doctor' ? appointment.patientName : appointment.doctorName) || '...'
        : '...';

    if (loadingAppt) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
        </div>
    );

    if (accessError) {
        const msg = { denied: 'Access Denied', 'not-found': 'Not Found', 'not-eligible': 'Session Not Active' }[accessError];
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-slate-800 rounded-3xl p-10 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <Typography variant="h5" color="text.primary" sx={{ mb: 3 }}>{msg}</Typography>
                    <button onClick={() => navigate('/dashboard')}
                        className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (roomFull) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-slate-800 rounded-3xl p-10 text-center">
                <Typography variant="h5" color="text.primary" sx={{ mb: 3 }}>Room is Full</Typography>
                <button onClick={() => navigate('/appointments')} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold">
                    Back to Appointments
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-900 overflow-hidden">
            {/* ── Remote video — fills entire screen ── */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    remoteStream && !isRemoteCameraOff ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* ── Placeholder when no remote video ── */}
            {(!remoteStream || isRemoteCameraOff) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 z-10">
                    <div className="w-28 h-28 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-500 mb-6 animate-pulse">
                        {peerLeft ? <Users size={56} /> : isRemoteCameraOff ? <CameraOff size={56} /> : <Loader2 size={56} className="animate-spin text-teal-500/50" />}
                    </div>
                    <Typography variant="subtitle1" color="text.primary" sx={{ mb: 1 }}>
                        {peerLeft ? 'Participant Left' : isRemoteCameraOff ? 'Camera is Off' : 'Waiting for connection...'}
                    </Typography>
                    <p className="text-slate-400 text-sm text-center max-w-xs">
                        {peerLeft ? 'The other person has ended the call.'
                            : isRemoteCameraOff ? 'The participant turned off their camera.'
                            : user?.role === 'Doctor' ? 'Waiting for the patient to join.'
                            : 'The doctor will be with you shortly.'}
                    </p>
                </div>
            )}

            {/* ── Local video PiP — bottom right ── */}
            <div className="absolute bottom-24 right-4 w-40 h-28 rounded-2xl overflow-hidden border-2 border-teal-500 shadow-2xl bg-slate-700 z-50">
                {localStream && !isCameraOff && !permissionError ? (
                    <video ref={localVideoRef} autoPlay playsInline muted
                        className="w-full h-full object-cover scale-x-[-1]" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 p-2 text-center">
                        <CameraOff className={`w-6 h-6 mb-1 ${permissionError ? 'text-amber-500' : 'text-slate-500'}`} />
                        {permissionError && (
                            <button onClick={retryMedia} className="text-[8px] font-bold text-teal-400 uppercase">
                                Retry Camera
                            </button>
                        )}
                    </div>
                )}
                <div className="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 rounded-lg">
                    <span className="text-white text-[9px] font-bold">You</span>
                </div>
            </div>

            {/* ── Remote status badges — top left ── */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                {remoteStream && isRemoteMuted && !peerLeft && (
                    <div className="bg-red-500/90 text-white px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-black backdrop-blur-sm">
                        <MicOff size={13} /> Muted
                    </div>
                )}
                {remoteStream && isRemoteCameraOff && !peerLeft && (
                    <div className="bg-slate-600/90 text-white px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-black backdrop-blur-sm">
                        <CameraOff size={13} /> Cam Off
                    </div>
                )}
            </div>

            {/* ── Remote name — bottom left ── */}
            {remoteStream && (
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-2 z-20">
                    <span className="text-white text-sm font-semibold">{remoteName}</span>
                    {isRemoteMuted && <MicOff size={12} className="text-red-400" />}
                    {isRemoteCameraOff && <CameraOff size={12} className="text-slate-400" />}
                </div>
            )}

            {/* ── Peer left banner ── */}
            <AnimatePresence>
                {peerLeft && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="absolute top-16 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl z-30">
                        The other participant has left the call.
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Connection status — top center ── */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${
                    connectionStatus === 'connected'
                        ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-teal-400' : 'bg-amber-400 animate-pulse'}`} />
                    {connectionStatus === 'connected' ? 'Clinical Session Live' : socketConnected ? 'Connecting...' : 'Searching for Signal...'}
                </div>
            </div>

            {/* ── Chat toggle — top right ── */}
            <div className="absolute top-4 right-4 z-30">
                <button onClick={() => setIsChatOpen(!isChatOpen)}
                    className="relative bg-black/40 backdrop-blur-sm text-white p-2.5 rounded-full hover:bg-black/60 transition-all">
                    <MessageSquare size={20} />
                    {unreadCount > 0 && !isChatOpen && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Controls — bottom center, always visible ── */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
                <ControlBtn onClick={toggleMute} active={!isMuted} title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </ControlBtn>
                <ControlBtn onClick={toggleCamera} active={!isCameraOff} title={isCameraOff ? 'Camera On' : 'Camera Off'}>
                    {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
                </ControlBtn>
                <ControlBtn onClick={handleEndCall} danger title="End Call">
                    <PhoneOff size={22} />
                </ControlBtn>
            </div>

            {/* ── Chat sidebar — fixed overlay ── */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ duration: 0.25 }}
                        className="fixed top-0 right-0 h-full w-80 bg-slate-800 border-l border-slate-700 flex flex-col z-[100] shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                            <span className="text-white font-bold text-sm">Chat</span>
                            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg) => {
                                const isOwn = msg.senderName === (user?.fullName || 'You');
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                        <span className="text-slate-400 text-[10px] mb-1">
                                            {msg.senderName} · {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                                            isOwn ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-slate-700 text-white rounded-bl-sm'
                                        }`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-700 flex gap-2">
                            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type a message..." maxLength={1000}
                                className="flex-1 bg-slate-700 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400" />
                            <button type="submit" disabled={!chatInput.trim()}
                                className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-40">
                                <Send size={16} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
