import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Resolves a doctor profile photo path to a full displayable URL.
 * Handles: null, full URLs (http/https/cloudinary), and relative paths
 */
export function getDoctorPhotoUrl(profilePhoto) {
    if (!profilePhoto) return null;
    if (profilePhoto.startsWith('http://') || profilePhoto.startsWith('https://')) {
        return profilePhoto;
    }
    const base = import.meta.env.VITE_DOCTOR_SERVICE_URL || 'http://localhost:5010';
    const clean = profilePhoto.startsWith('/') ? profilePhoto : `/${profilePhoto}`;
    return `${base}${clean}`;
}

export function getAuthPhotoUrl(profilePhoto) {
    if (!profilePhoto) return null;
    if (profilePhoto.startsWith('http://') || profilePhoto.startsWith('https://')) {
        return profilePhoto;
    }
    // Use dedicated base URL env var; fall back to stripping /api/auth from the auth URL
    const base =
        import.meta.env.VITE_API_AUTH_BASE_URL ||
        (import.meta.env.VITE_API_AUTH_URL?.replace(/\/api\/auth$/, '')) ||
        'http://localhost:5001';
    const clean = profilePhoto.startsWith('/') ? profilePhoto : `/${profilePhoto}`;
    return `${base}${clean}`;
}

export function getPatientPhotoUrl(profilePhoto) {
    if (!profilePhoto) return null;
    if (profilePhoto.startsWith('http://') || profilePhoto.startsWith('https://')) {
        return profilePhoto;
    }
    const base =
        import.meta.env.VITE_API_PATIENT_URL?.replace(/\/api\/patients$/, '') ||
        'http://localhost:5002';
    const clean = profilePhoto.startsWith('/') ? profilePhoto : `/${profilePhoto}`;
    return `${base}${clean}`;
}

export function getAppointmentAttachmentUrl(attachmentUrl) {
    if (!attachmentUrl) return null;
    if (attachmentUrl.startsWith('http://') || attachmentUrl.startsWith('https://')) {
        return attachmentUrl;
    }
    // Attachments are served by the appointment-service, proxied through the gateway
    const base =
        import.meta.env.VITE_API_GATEWAY_URL?.replace(/\/api$/, '') ||
        'http://localhost:5050';
    const clean = attachmentUrl.startsWith('/') ? attachmentUrl : `/${attachmentUrl}`;
    return `${base}${clean}`;
}
