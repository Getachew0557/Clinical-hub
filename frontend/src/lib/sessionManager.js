import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/useToast';
import authService from '../api/auth.service';

// ── Session Configuration ─────────────────────────────────────────────────────────

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT = 5 * 60 * 1000; // 5 minutes before expiry
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute

// ── Session Manager Hook ───────────────────────────────────────────────────────────

export const useSessionManager = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const { warning: toastWarning } = useToast();

  // Get session expiry from localStorage or calculate from token
  const getSessionExpiry = useCallback(() => {
    const expiry = localStorage.getItem('sessionExpiry');
    if (expiry) {
      return parseInt(expiry, 10);
    }
    // Default to 30 minutes from now if not set
    return Date.now() + SESSION_TIMEOUT;
  }, []);

  // Update session activity
  const updateActivity = useCallback(() => {
    const expiry = Date.now() + SESSION_TIMEOUT;
    localStorage.setItem('sessionExpiry', expiry.toString());
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  // Check session status
  const checkSession = useCallback(() => {
    const expiry = getSessionExpiry();
    const now = Date.now();
    const remaining = expiry - now;

    if (remaining <= 0) {
      // Session expired
      handleSessionExpired();
    } else if (remaining <= WARNING_TIMEOUT) {
      // Show warning
      setShowWarning(true);
      setTimeRemaining(Math.ceil(remaining / 1000));
    } else {
      // Session active
      setShowWarning(false);
    }
  }, [getSessionExpiry]);

  // Handle session expiry
  const handleSessionExpired = useCallback(() => {
    authService.logout();
    toastWarning('Your session has expired. Please log in again.');
    window.location.href = '/login?session=expired';
  }, [toastWarning]);

  // Extend session
  const extendSession = useCallback(() => {
    updateActivity();
    setShowWarning(false);
    toastWarning('Session extended successfully.');
  }, [updateActivity, toastWarning]);

  // Logout manually
  const logout = useCallback(() => {
    authService.logout();
    window.location.href = '/login';
  }, []);

  // Initialize session monitoring
  useEffect(() => {
    // Set initial expiry if not set
    if (!localStorage.getItem('sessionExpiry')) {
      updateActivity();
    }

    // Activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => updateActivity();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Session check interval
    const interval = setInterval(checkSession, ACTIVITY_CHECK_INTERVAL);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [updateActivity, checkSession]);

  // Format remaining time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    showWarning,
    timeRemaining,
    extendSession,
    logout,
    formatTime,
  };
};

// ── Session Activity Tracker (for audit logs) ───────────────────────────────────────

export const trackSessionActivity = (action, details = {}) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const activity = {
    userId: user.id,
    action,
    timestamp: new Date().toISOString(),
    details,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Store in localStorage for now (should be sent to backend)
  const activities = JSON.parse(localStorage.getItem('sessionActivities') || '[]');
  activities.push(activity);
  localStorage.setItem('sessionActivities', JSON.stringify(activities.slice(-100))); // Keep last 100
};

export default { useSessionManager, trackSessionActivity };
