import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * RoleGuard — renders children only if the current user's role is in allowedRoles.
 * Falls back to <Navigate to="/dashboard" replace /> by default.
 */
export default function RoleGuard({ allowedRoles, children, fallback }) {
    const { user } = useSelector((state) => state.auth);
    const role = user?.role;

    if (role && allowedRoles.includes(role)) {
        return children;
    }

    return fallback ?? <Navigate to="/dashboard" replace />;
}
