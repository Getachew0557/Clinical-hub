/**
 * Pure utility functions for video consultation logic.
 * All functions are side-effect free and easily testable.
 */

/**
 * Returns true if the userId is either the doctor or patient of the appointment.
 * @param {Object} appointment - { doctorId, patientId }
 * @param {string} userId
 */
export function isParticipant(appointment, userId) {
    if (!appointment || !userId) return false;
    return appointment.doctorId === userId || appointment.patientId === userId;
}

/**
 * Returns true if the appointment status allows a video call.
 * @param {string} status
 */
export function isVideoEligible(status) {
    return status === 'Confirmed' || status === 'In Progress';
}

/**
 * Maps RTCIceConnectionState to a UI-friendly Connection_Status string.
 * @param {string} iceState
 * @returns {'idle'|'connecting'|'connected'|'reconnecting'|'failed'}
 */
export function mapIceStateToStatus(iceState) {
    switch (iceState) {
        case 'connected':
        case 'completed':
            return 'connected';
        case 'disconnected':
            return 'reconnecting';
        case 'failed':
        case 'closed':
            return 'failed';
        case 'checking':
        case 'new':
            return 'connecting';
        default:
            return 'connecting';
    }
}

/**
 * Sorts appointments by appointmentDate ASC, then appointmentTime ASC.
 * @param {Array} appointments
 */
export function sortAppointments(appointments) {
    return [...appointments].sort((a, b) => {
        const dateA = a.appointmentDate || a.date || '';
        const dateB = b.appointmentDate || b.date || '';
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        const timeA = a.appointmentTime || '';
        const timeB = b.appointmentTime || '';
        return timeA.localeCompare(timeB);
    });
}

/**
 * Returns true if the message is valid (1–1000 chars).
 * @param {string} message
 */
export function validateMessageLength(message) {
    return typeof message === 'string' && message.length > 0 && message.length <= 1000;
}

/**
 * WebRTC configuration with public STUN + TURN servers.
 * TURN is required when both peers are behind symmetric NAT (common in mobile/corporate networks).
 */
export const RTC_CONFIG = {
    iceServers: [
        // Google STUN
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Cloudflare STUN
        { urls: 'stun:stun.cloudflare.com:3478' },
        // Free TURN — Metered (reliable free tier)
        {
            urls: [
                'turn:a.relay.metered.ca:80',
                'turn:a.relay.metered.ca:80?transport=tcp',
                'turn:a.relay.metered.ca:443',
                'turn:a.relay.metered.ca:443?transport=tcp',
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        // Backup TURN — Open Relay
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
};
