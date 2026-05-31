import { useToast } from '../hooks/useToast';

// ── Error Types ───────────────────────────────────────────────────────────────────

export const ErrorType = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
};

// ── Error Classification ───────────────────────────────────────────────────────────

export const classifyError = (error) => {
  if (!error) return ErrorType.UNKNOWN;

  // Network errors (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return ErrorType.NETWORK;
    }
    return ErrorType.NETWORK;
  }

  const status = error.response?.status;

  // Authentication errors
  if (status === 401 || status === 403) {
    return ErrorType.AUTH;
  }

  // Validation errors
  if (status === 400 || status === 422) {
    return ErrorType.VALIDATION;
  }

  // Server errors
  if (status >= 500) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
};

// ── Error Message Extraction ───────────────────────────────────────────────────────

export const getErrorMessage = (error, errorType) => {
  // Extract message from response
  const responseMessage = error.response?.data?.message;
  const responseError = error.response?.data?.error;

  if (responseMessage) return responseMessage;
  if (responseError) return responseError;

  // Default messages based on error type
  const defaultMessages = {
    [ErrorType.NETWORK]: 'Network error. Please check your connection and try again.',
    [ErrorType.VALIDATION]: 'Please check your input and try again.',
    [ErrorType.AUTH]: 'Authentication failed. Please log in again.',
    [ErrorType.SERVER]: 'Server error. Please try again later.',
    [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
  };

  return defaultMessages[errorType] || defaultMessages[ErrorType.UNKNOWN];
};

// ── Error Handler Hook ─────────────────────────────────────────────────────────────

export const useErrorHandler = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const handleError = (error, customMessage = null) => {
    const errorType = classifyError(error);
    const message = customMessage || getErrorMessage(error, errorType);

    console.error('Error:', error);
    console.error('Error Type:', errorType);
    console.error('Error Message:', message);

    // Show toast notification
    toastError(message);

    // Handle specific error types
    if (errorType === ErrorType.AUTH) {
      // Redirect to login if token expired
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?session=expired';
      }
    }

    return { errorType, message };
  };

  const handleSuccess = (message) => {
    toastSuccess(message);
  };

  return { handleError, handleSuccess };
};

// ── Async Error Wrapper ───────────────────────────────────────────────────────────

export const withErrorHandling = async (fn, errorHandler) => {
  try {
    const result = await fn();
    return { success: true, data: result };
  } catch (error) {
    errorHandler(error);
    return { success: false, error };
  }
};

// ── Form Error Handler ────────────────────────────────────────────────────────────

export const handleFormError = (error, setError) => {
  const errorType = classifyError(error);

  if (errorType === ErrorType.VALIDATION) {
    // Extract field-specific errors
    const errors = error.response?.data?.errors || {};
    Object.entries(errors).forEach(([field, message]) => {
      setError(field, { type: 'manual', message });
    });
  } else {
    // Set general error
    setError('root', {
      type: 'manual',
      message: getErrorMessage(error, errorType),
    });
  }
};

export default {
  ErrorType,
  classifyError,
  getErrorMessage,
  useErrorHandler,
  withErrorHandling,
  handleFormError,
};
