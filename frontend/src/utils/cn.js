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
    // Already a full URL (Cloudinary, http, https)
    if (profilePhoto.startsWith('http://') || profilePhoto.startsWith('https://')) {
        return profilePhoto;
    }
    // Relative path — serve from doctor-service static files
    const base = import.meta.env.VITE_DOCTOR_SERVICE_URL || 'http://localhost:5010';
    const path = profilePhoto.startsWith('/') ? profilePhoto : `/${profilePhoto}`;
    return `${base}${path}`;
}

export function getAuthPhotoUrl(profilePhoto) {
    if (!profilePhoto) return null;
    if (profilePhoto.startsWith('http://') || profilePhoto.startsWith('https://')) {
        return profilePhoto;
    }
    const base = import.meta.env.VITE_API_AUTH_URL?.replace('/api/auth', '') || 'http://localhost:5001';
    const path = profilePhoto.startsWith('/') ? profilePhoto : `/${profilePhoto}`;
    return `${base}${path}`;
}
