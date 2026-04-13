import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { mapIceStateToStatus, RTC_CONFIG } from './videoUtils';

const SIGNALING_URL = import.meta.env.VITE_API_SIGNALING_URL || 'http://localhost:5050';

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

    const [isRemoteMuted, setIsRemoteMuted] = useState(false);
    const [isRemoteCameraOff, setIsRemoteCameraOff] = useState(false);

    const [socketConnected, setSocketConnected] = useState(false);

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
            return null; // Continue as receive-only
        }
    }, []);

    const createPeerConnection = useCallback((stream) => {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // Add local tracks if available
        if (stream) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        // Remote stream
        const remote = new MediaStream();
        setRemoteStream(remote);
        pc.ontrack = (event) => {
            console.log('[Video] Received remote track');
            event.streams[0].getTracks().forEach((track) => {
                remote.addTrack(track);
            });
        };

        // ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', { roomId, candidate: event.candidate });
            }
        };

        // Connection state
        pc.oniceconnectionstatechange = () => {
            console.log('[Video] ICE State:', pc.iceConnectionState);
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
        setSocketConnected(false);
        setIsRemoteMuted(false);
        setIsRemoteCameraOff(false);
    }, []);

    // Initialize media as soon as roomId is available
    useEffect(() => {
        if (roomId) {
            getMedia();
        }
    }, [roomId, getMedia]);

    useEffect(() => {
        if (!roomId) return;

        const token = localStorage.getItem('token');
        const socket = io(`${SIGNALING_URL}/video`, {
            auth: { token },
            // Removed restricted transports to allow polling fallback
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Video] Signaling socket connected');
            socket.emit('join-room', { roomId });
            setSocketConnected(true);
        });

        socket.on('connect_error', (err) => {
            console.error('[Video] Socket Connect Error:', err.message);
        });

        socket.on('room-full', () => {
            setRoomFull(true);
            setConnectionStatus('failed');
        });

        // Other peer joined — we are the initiator
        socket.on('peer-joined', async () => {
            console.log('[Video] Peer joined, starting handshake');
            const stream = await getMedia();
            // Proceed even if stream is null (receive-only)
            const pc = createPeerConnection(stream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { roomId, offer });
            
            // Send current media state if we have tracks
            if (localStreamRef.current) {
                socket.emit('media-state-changed', {
                    roomId,
                    isMuted: !localStreamRef.current.getAudioTracks()[0]?.enabled,
                    isCameraOff: !localStreamRef.current.getVideoTracks()[0]?.enabled
                });
            }
        });

        // We received an offer — we are the receiver
        socket.on('offer', async (offer) => {
            console.log('[Video] Received offer, responding');
            const stream = await getMedia();
            // Proceed even if stream is null (receive-only)
            const pc = createPeerConnection(stream);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { roomId, answer });

            // Send current media state if we have tracks
            if (localStreamRef.current) {
                socket.emit('media-state-changed', {
                    roomId,
                    isMuted: !localStreamRef.current.getAudioTracks()[0]?.enabled,
                    isCameraOff: !localStreamRef.current.getVideoTracks()[0]?.enabled
                });
            }
        });

        socket.on('answer', async (answer) => {
            console.log('[Video] Received answer');
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
            console.log('[Video] Call ended by other party');
            setConnectionStatus('failed');
            cleanup();
        });

        socket.on('peer-disconnected', () => {
            console.log('[Video] Peer disconnected');
            setPeerLeft(true);
            setConnectionStatus('reconnecting');
            setIsRemoteMuted(false);
            setIsRemoteCameraOff(false);
            // Don't close PC yet, wait for them to come back or end-call
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

    const toggleMute = useCallback(async () => {
        if (!localStreamRef.current) return;

        const newState = !isMuted;
        if (newState) {
            // Mute: Stop hardware to turn off light/sensor
            localStreamRef.current.getAudioTracks().forEach((t) => t.stop());
        } else {
            // Unmute: Re-acquire hardware
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const newTrack = newStream.getAudioTracks()[0];
                
                // Replace in local stream ref
                const oldTrack = localStreamRef.current.getAudioTracks()[0];
                if (oldTrack) localStreamRef.current.removeTrack(oldTrack);
                localStreamRef.current.addTrack(newTrack);
                setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

                // Replace in PeerConnection
                if (pcRef.current) {
                    const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'audio');
                    if (sender) await sender.replaceTrack(newTrack);
                }
            } catch (err) {
                console.error('Failed to re-acquire audio:', err);
                return;
            }
        }
        
        setIsMuted(newState);
        socketRef.current?.emit('media-state-changed', { roomId, isMuted: newState });
    }, [isMuted, roomId]);

    const toggleCamera = useCallback(async () => {
        if (!localStreamRef.current) return;

        const newState = !isCameraOff;
        if (newState) {
            // Camera Off: Stop hardware to turn off light
            localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
        } else {
            // Camera On: Re-acquire hardware
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newTrack = newStream.getVideoTracks()[0];
                
                // Replace in local stream ref
                const oldTrack = localStreamRef.current.getVideoTracks()[0];
                if (oldTrack) localStreamRef.current.removeTrack(oldTrack);
                localStreamRef.current.addTrack(newTrack);
                setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

                // Replace in PeerConnection
                if (pcRef.current) {
                    const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) await sender.replaceTrack(newTrack);
                }
            } catch (err) {
                console.error('Failed to re-acquire video:', err);
                return;
            }
        }

        setIsCameraOff(newState);
        socketRef.current?.emit('media-state-changed', { roomId, isCameraOff: newState });
    }, [isCameraOff, roomId]);

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
