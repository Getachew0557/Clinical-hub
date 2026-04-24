import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { mapIceStateToStatus, RTC_CONFIG } from './videoUtils';

// The gateway proxies /socket.io → appointment-service (port 5003)
// Use the gateway base URL (same origin as the API)
const SIGNALING_URL = import.meta.env.VITE_API_GATEWAY_URL
  ? import.meta.env.VITE_API_GATEWAY_URL.replace('/api', '')
  : (import.meta.env.VITE_API_SIGNALING_URL || 'http://localhost:5050');

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
    const [isRemoteMuted, setIsRemoteMuted] = useState(false);
    const [isRemoteCameraOff, setIsRemoteCameraOff] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);

    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null); // keep stable ref for the video element

    // ─── Get media (audio + video) ─────────────────────────────────────────
    const getMedia = useCallback(async () => {
        if (localStreamRef.current) return localStreamRef.current;
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

    // ─── Create RTCPeerConnection ──────────────────────────────────────────
    const createPeerConnection = useCallback((stream) => {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        if (stream) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        // Create a stable remote MediaStream and keep a ref to it
        const remote = new MediaStream();
        remoteStreamRef.current = remote;
        setRemoteStream(remote);

        pc.ontrack = (event) => {
            console.log('[Video] Received remote track:', event.track.kind);
            // Use event.streams[0] which is the complete stream from the remote peer
            if (event.streams && event.streams[0]) {
                remoteStreamRef.current = event.streams[0];
                // Force React re-render with the actual stream from the peer
                setRemoteStream(event.streams[0]);
            } else {
                // Fallback: manually add track
                remoteStreamRef.current.addTrack(event.track);
                setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', { roomId, candidate: event.candidate });
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('[Video] ICE State:', pc.iceConnectionState);
            setConnectionStatus(mapIceStateToStatus(pc.iceConnectionState));
        };

        return pc;
    }, [roomId]);

    // ─── Cleanup ───────────────────────────────────────────────────────────
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
        setSocketConnected(false);
        setIsRemoteMuted(false);
        setIsRemoteCameraOff(false);
        setIsMuted(false);
        setIsCameraOff(false);
    }, []);

    // ─── Init media on mount ───────────────────────────────────────────────
    useEffect(() => {
        if (roomId) getMedia();
    }, [roomId, getMedia]);

    // ─── Signaling ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!roomId) return;

        const token = localStorage.getItem('token');
        const socket = io(`${SIGNALING_URL}/video`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Video] Socket connected');
            socket.emit('join-room', { roomId });
            setSocketConnected(true);
        });

        socket.on('connect_error', (err) => {
            console.error('[Video] Socket error:', err.message);
        });

        socket.on('room-full', () => {
            setRoomFull(true);
            setConnectionStatus('failed');
        });

        socket.on('peer-joined', async () => {
            console.log('[Video] Peer joined — initiating offer');
            const stream = await getMedia();
            const pc = createPeerConnection(stream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { roomId, offer });
            if (localStreamRef.current) {
                socket.emit('media-state-changed', {
                    roomId,
                    isMuted: !localStreamRef.current.getAudioTracks()[0]?.enabled,
                    isCameraOff: !localStreamRef.current.getVideoTracks()[0]?.enabled,
                });
            }
        });

        socket.on('offer', async (offer) => {
            console.log('[Video] Received offer — sending answer');
            const stream = await getMedia();
            const pc = createPeerConnection(stream);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { roomId, answer });
            if (localStreamRef.current) {
                socket.emit('media-state-changed', {
                    roomId,
                    isMuted: !localStreamRef.current.getAudioTracks()[0]?.enabled,
                    isCameraOff: !localStreamRef.current.getVideoTracks()[0]?.enabled,
                });
            }
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

        socket.on('media-state-changed', ({ isMuted, isCameraOff }) => {
            if (isMuted !== undefined) setIsRemoteMuted(isMuted);
            if (isCameraOff !== undefined) setIsRemoteCameraOff(isCameraOff);
        });

        socket.on('call-ended', () => {
            setConnectionStatus('failed');
            cleanup();
        });

        socket.on('peer-disconnected', () => {
            setPeerLeft(true);
            setConnectionStatus('reconnecting');
            setIsRemoteMuted(false);
            setIsRemoteCameraOff(false);
        });

        socket.on('chat-message', ({ message, senderName, time }) => {
            const msg = { id: crypto.randomUUID(), senderName, message, time };
            setMessages((prev) => [...prev, msg]);
            setUnreadCount((prev) => prev + 1);
        });

        return () => { cleanup(); };
    }, [roomId, getMedia, createPeerConnection, cleanup]);

    // ─── Toggle Mute ───────────────────────────────────────────────────────
    const toggleMute = useCallback(() => {
        if (!localStreamRef.current) return;
        const audioTracks = localStreamRef.current.getAudioTracks();
        if (audioTracks.length === 0) return;
        const newEnabled = !audioTracks[0].enabled;
        audioTracks.forEach(t => { t.enabled = newEnabled; });
        // Also update the sender in the peer connection
        if (pcRef.current) {
            pcRef.current.getSenders()
                .filter(s => s.track?.kind === 'audio')
                .forEach(s => { if (s.track) s.track.enabled = newEnabled; });
        }
        setIsMuted(!newEnabled);
        socketRef.current?.emit('media-state-changed', { roomId, isMuted: !newEnabled });
    }, [roomId]);

    // ─── Toggle Camera ─────────────────────────────────────────────────────
    // Use a ref to avoid stale closure — isCameraOff state is stale inside useCallback
    const isCameraOffRef = useRef(false);
    useEffect(() => { isCameraOffRef.current = isCameraOff; }, [isCameraOff]);

    const toggleCamera = useCallback(async () => {
        if (!localStreamRef.current) return;

        if (!isCameraOffRef.current) {
            // ── Turning camera OFF — stop track to turn off hardware light ──
            const videoTracks = localStreamRef.current.getVideoTracks();
            videoTracks.forEach(t => {
                t.stop();
                localStreamRef.current.removeTrack(t);
            });
            isCameraOffRef.current = true;
            setIsCameraOff(true);
            setLocalStream(new MediaStream(localStreamRef.current.getAudioTracks()));
            socketRef.current?.emit('media-state-changed', { roomId, isCameraOff: true });
        } else {
            // ── Turning camera ON — get fresh track ──
            try {
                const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = newVideoStream.getVideoTracks()[0];
                localStreamRef.current.addTrack(newVideoTrack);

                if (pcRef.current) {
                    const senders = pcRef.current.getSenders();
                    const videoSender = senders.find(s => s.track?.kind === 'video');
                    if (videoSender) {
                        await videoSender.replaceTrack(newVideoTrack);
                    } else {
                        pcRef.current.addTrack(newVideoTrack, localStreamRef.current);
                    }
                }

                isCameraOffRef.current = false;
                setIsCameraOff(false);
                setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
                socketRef.current?.emit('media-state-changed', { roomId, isCameraOff: false });
            } catch (err) {
                console.error('Failed to re-enable camera:', err);
                setPermissionError(true);
            }
        }
    }, [roomId]);

    // ─── End Call ──────────────────────────────────────────────────────────
    const endCall = useCallback(() => {
        socketRef.current?.emit('end-call', { roomId });
        cleanup();
    }, [roomId, cleanup]);

    // ─── Send Chat Message ─────────────────────────────────────────────────
    const sendMessage = useCallback((message, senderName) => {
        if (!socketRef.current || !message.trim()) return;
        const time = new Date().toISOString();
        const msg = { id: crypto.randomUUID(), senderName, message, time };
        setMessages((prev) => [...prev, msg]);
        socketRef.current.emit('chat-message', { roomId, message, senderName, time });
    }, [roomId]);

    // ─── Retry Media ───────────────────────────────────────────────────────
    const retryMedia = useCallback(async () => {
        setPermissionError(false);
        // Clear existing stream so getMedia fetches fresh
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        setLocalStream(null);
        await getMedia();
    }, [getMedia]);

    return {
        localStream,
        remoteStream,
        connectionStatus,
        isMuted,
        isCameraOff,
        isRemoteMuted,
        isRemoteCameraOff,
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
        socketConnected,
    };
}
