import React from 'react';
import { Card as MuiCard, CardContent as MuiCardContent, CardActions as MuiCardActions } from '@mui/material';
import { cn } from '../../utils/cn';

/**
 * Unified Card component
 * Provides consistent card styling across the application
 */
const Card = React.forwardRef(({ className, children, sx, ...props }, ref) => {
  return (
    <MuiCard
      ref={ref}
      className={cn('border border-slate-200 bg-white', className)}
      sx={{
        borderRadius: 3,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiCard>
  );
});

Card.displayName = 'Card';

/**
 * CardContent component
 */
const CardContent = React.forwardRef(({ className, children, sx, ...props }, ref) => {
  return (
    <MuiCardContent
      ref={ref}
      className={cn('p-6', className)}
      sx={sx}
      {...props}
    >
      {children}
    </MuiCardContent>
  );
});

CardContent.displayName = 'CardContent';

/**
 * CardActions component
 */
const CardActions = React.forwardRef(({ className, children, sx, ...props }, ref) => {
  return (
    <MuiCardActions
      ref={ref}
      className={cn('p-6 pt-0 flex gap-2', className)}
      sx={sx}
      {...props}
    >
      {children}
    </MuiCardActions>
  );
});

CardActions.displayName = 'CardActions';

export { Card, CardContent, CardActions };
