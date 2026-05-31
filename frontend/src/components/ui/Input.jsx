import React from 'react';
import { TextField as MuiTextField } from '@mui/material';
import { cn } from '../../utils/cn';

/**
 * Unified Input/TextField component
 * Provides consistent input styling across the application
 */
const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      required = false,
      className,
      sx,
      ...props
    },
    ref
  ) => {
    return (
      <MuiTextField
        ref={ref}
        label={label}
        error={error}
        helperText={helperText}
        fullWidth={fullWidth}
        required={required}
        className={cn('font-normal', className)}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#f8fafc',
            '&:hover': {
              backgroundColor: '#f1f5f9',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 600,
            color: '#64748b',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#0d9488',
          },
          ...sx,
        }}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
