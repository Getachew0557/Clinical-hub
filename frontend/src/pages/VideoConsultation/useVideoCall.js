import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { mapIceStateToStatus, RTC_CONFIG } from './videoUtils';

const SIGNALING_URL = import.meta.env.VITE_API_GATEWAY_URL?.replace('/api', '') || 'http://localhost:5008';

export default function useVideoCall(roomId) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('idle');
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [permissionError, setPermissionError] = useState(false);
    const [roomFull, setRoomFull] = useState(false);
    const [peerLeft, setPeerLeft] = useState(false);

    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const navigate = useRef(null); // set externally via setNavigate

    const getMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            setLocalStream(stream);
            setPermissionError(false);
            return stream;
        } catch (err) {
            console.error('getUserMedia error:', err);
            setPermissionError(true);
            return null;
        }
    }, []);

    const createPeerConnection = useCallback((stream) => {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Remote stream
        const remote = new MediaStream();
        setRemoteStream(remote);
        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => remote.addTrack(track));
        };

        // ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', { roomId, candidate: event.candidate });
            }
        };

        // Connection state
        pc.oniceconnectionstatechange = () => {
            const status = mapIceStateToStatus(pc.iceConnectionState);
            setConnectionStatus(status);
        };

        return pc;
    }, [roomId]);

    const cleanup = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setConnectionStatus('idle');
    }, []);

    useEffect(() => {
        if (!roomId) return;

        const token = localStorage.getItem('token');
        const socket = io(`${SIGNALING_URL}/video`, {
            auth: { token },
            transports: ['websocket'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join-room', { roomId });
            setConnectionStatus('connecting');
        });

        socket.on('room-full', () => {
            setRoomFull(true);
            setConnectionStatus('failed');
        });

        // Other peer joined — we are the initiator
        socket.on('peer-joined', async () => {
            const stream = await getMedia();
            if (!stream) return;
            const pc = createPeerConnection(stream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { roomId, offer });
        });

        // We received an offer — we are the receiver
        socket.on('offer', async (offer) => {
            const stream = await getMedia();
            if (!stream) return;
            const pc = createPeerConnection(stream);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { roomId, answer });
        });

        socket.on('answer', async (answer) => {
            if (pcRef.current) {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on('ice-candidate', async (candidate) => {
            if (pcRef.current && candidate) {
                try {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.warn('ICE candidate error:', e);
                }
            }
        });

        socket.on('call-ended', () => {
            setConnectionStatus('failed');
            cleanup();
        });

        socket.on('peer-disconnected', () => {
            setPeerLeft(true);
            setConnectionStatus('reconnecting');
        });

        socket.on('chat-message', ({ message, senderName, time }) => {
            const msg = { id: crypto.randomUUID(), senderName, message, time };
            setMessages((prev) => [...prev, msg]);
            setUnreadCount((prev) => prev + 1);
        });

        return () => {
            cleanup();
        };
    }, [roomId, getMedia, createPeerConnection, cleanup]);

    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach((t) => {
                t.enabled = !t.enabled;
            });
            setIsMuted((prev) => !prev);
        }
    }, []);

    const toggleCamera = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach((t) => {
                t.enabled = !t.enabled;
            });
            setIsCameraOff((prev) => !prev);
        }
    }, []);

    const endCall = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('end-call', { roomId });
        }
        cleanup();
    }, [roomId, cleanup]);

    const sendMessage = useCallback((message, senderName) => {
        if (!socketRef.current || !message.trim()) return;
        const time = new Date().toISOString();
        const msg = { id: crypto.randomUUID(), senderName, message, time };
        setMessages((prev) => [...prev, msg]);
        socketRef.current.emit('chat-message', { roomId, message, senderName, time });
    }, [roomId]);

    const retryMedia = useCallback(() => {
        setPermissionError(false);
        getMedia();
    }, [getMedia]);

    return {
        localStream,
        remoteStream,
        connectionStatus,
        isMuted,
        isCameraOff,
        isChatOpen,
        setIsChatOpen,
        messages,
        unreadCount,
        setUnreadCount,
        permissionError,
        roomFull,
        peerLeft,
        toggleMute,
        toggleCamera,
        endCall,
        sendMessage,
        retryMedia,
    };
}
