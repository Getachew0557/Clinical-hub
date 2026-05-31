import React from 'react';
import { Chip as MuiChip } from '@mui/material';
import { cn } from '../../utils/cn';

/**
 * Unified Badge/Status component
 * Provides consistent badge styling across the application
 */
const Badge = React.forwardRef(
  (
    {
      children,
      variant = 'default',
      size = 'small',
      className,
      sx,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: {
        bgcolor: '#f1f5f9',
        color: '#475569',
      },
      primary: {
        bgcolor: '#ccfbf1',
        color: '#0d9488',
      },
      success: {
        bgcolor: '#f0fdf4',
        color: '#059669',
      },
      warning: {
        bgcolor: '#fffbeb',
        color: '#d97706',
      },
      error: {
        bgcolor: '#fef2f2',
        color: '#dc2626',
      },
      info: {
        bgcolor: '#eff6ff',
        color: '#0284c7',
      },
    };

    const selectedStyle = variantStyles[variant] || variantStyles.default;

    return (
      <MuiChip
        ref={ref}
        label={children}
        size={size}
        className={cn('font-semibold', className)}
        sx={{
          borderRadius: 2,
          fontWeight: 600,
          ...selectedStyle,
          ...sx,
        }}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

/**
 * StatusBadge component for appointment/patient statuses
 */
const StatusBadge = ({ status, className, sx, ...props }) => {
  const statusConfig = {
    'Pending': { variant: 'warning', label: 'Pending' },
    'Confirmed': { variant: 'primary', label: 'Confirmed' },
    'In Progress': { variant: 'info', label: 'In Progress' },
    'Completed': { variant: 'success', label: 'Completed' },
    'Cancelled': { variant: 'error', label: 'Cancelled' },
    'Paid': { variant: 'success', label: 'Paid' },
    'Unpaid': { variant: 'error', label: 'Unpaid' },
    'Active': { variant: 'success', label: 'Active' },
    'Inactive': { variant: 'default', label: 'Inactive' },
  };

  const config = statusConfig[status] || { variant: 'default', label: status };

  return (
    <Badge
      variant={config.variant}
      className={className}
      sx={sx}
      {...props}
    >
      {config.label}
    </Badge>
  );
};

export default Badge;
export { StatusBadge };
