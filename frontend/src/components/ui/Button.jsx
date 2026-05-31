import React from 'react';
import { Button as MuiButton } from '@mui/material';
import { cn } from '../../utils/cn';

/**
 * Unified Button component
 * Provides consistent styling across the application
 * Supports all MUI Button variants with custom styling
 */
const Button = React.forwardRef(
  (
    {
      children,
      variant = 'contained',
      color = 'primary',
      size = 'medium',
      fullWidth = false,
      disabled = false,
      startIcon,
      endIcon,
      className,
      sx,
      ...props
    },
    ref
  ) => {
    return (
      <MuiButton
        ref={ref}
        variant={variant}
        color={color}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled}
        startIcon={startIcon}
        endIcon={endIcon}
        className={cn('font-semibold', className)}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          ...sx,
        }}
        {...props}
      >
        {children}
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;
