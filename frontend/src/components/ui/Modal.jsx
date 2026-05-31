import React from 'react';
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
} from '@mui/material';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

/**
 * Unified Modal/Dialog component
 * Provides consistent modal styling across the application
 */
const Modal = React.forwardRef(
  (
    {
      open,
      onClose,
      title,
      children,
      maxWidth = 'md',
      fullWidth = true,
      showCloseButton = true,
      className,
      sx,
      ...props
    },
    ref
  ) => {
    return (
      <MuiDialog
        ref={ref}
        open={open}
        onClose={onClose}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
        className={className}
        PaperProps={{
          sx: {
            borderRadius: 3,
            ...sx,
          },
        }}
        {...props}
      >
        {title && (
          <MuiDialogTitle className="flex items-center justify-between p-6 border-b border-slate-100">
            <span className="text-xl font-bold text-slate-900">{title}</span>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            )}
          </MuiDialogTitle>
        )}
        {children}
      </MuiDialog>
    );
  }
);

Modal.displayName = 'Modal';

/**
 * ModalContent component
 */
const ModalContent = React.forwardRef(({ className, children, sx, ...props }, ref) => {
  return (
    <MuiDialogContent
      ref={ref}
      className={cn('p-6', className)}
      sx={sx}
      {...props}
    >
      {children}
    </MuiDialogContent>
  );
});

ModalContent.displayName = 'ModalContent';

/**
 * ModalActions component
 */
const ModalActions = React.forwardRef(
  ({ className, children, onCancel, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', loading = false, sx, ...props }, ref) => {
    return (
      <MuiDialogActions
        ref={ref}
        className={cn('p-6 pt-0 flex gap-3 justify-end', className)}
        sx={sx}
        {...props}
      >
        {onCancel && (
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
        )}
        {onConfirm && (
          <Button variant="contained" onClick={onConfirm} disabled={loading} loading={loading}>
            {loading ? 'Loading...' : confirmText}
          </Button>
        )}
        {children}
      </MuiDialogActions>
    );
  }
);

ModalActions.displayName = 'ModalActions';

export { Modal, ModalContent, ModalActions };
