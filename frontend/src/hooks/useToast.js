import { toast } from 'sonner';

/**
 * Custom hook for toast notifications
 * Replaces alert() with beautiful, accessible toast notifications
 */
export const useToast = () => {
  const success = (message, options = {}) => {
    toast.success(message, {
      position: 'top-right',
      duration: 4000,
      ...options,
    });
  };

  const error = (message, options = {}) => {
    toast.error(message, {
      position: 'top-right',
      duration: 6000,
      ...options,
    });
  };

  const info = (message, options = {}) => {
    toast.info(message, {
      position: 'top-right',
      duration: 4000,
      ...options,
    });
  };

  const warning = (message, options = {}) => {
    toast.warning(message, {
      position: 'top-right',
      duration: 4000,
      ...options,
    });
  };

  const loading = (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      ...options,
    });
  };

  const dismiss = (toastId) => {
    toast.dismiss(toastId);
  };

  return {
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
  };
};

export default useToast;
