import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Resolves a doctor profile photo path to a full displayable URL.
 * Handles: null, full URLs (http/https), and relative paths (uploads/...)
 */
export function getDoctorPhotoUrl(profilePhoto) {
    if (!profilePhoto) return null;
    if (profilePhoto.startsWith('http://') || profilePhoto.startsWith('https://')) {
        return profilePhoto;
    }
    const base = import.meta.env.VITE_DOCTOR_SERVICE_URL || 'http://localhost:5010';
    const path = profilePhoto.startsWith('/') ? profilePhoto : `/${profilePhoto}`;
    return `${base}${path}`;
}
