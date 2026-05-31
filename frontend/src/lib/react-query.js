import { QueryClient, QueryCache } from '@tanstack/react-query';
import { useToast } from '../hooks/useToast';

// Create a QueryClient instance with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (optional, can be disabled)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      // Global error handler for query errors
      console.error('Query error:', error);
      // You can add toast notification here if needed
    },
  }),
});

// Custom hook for query error handling
export const useQueryError = () => {
  const { error: toastError } = useToast();

  const handleError = (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    toastError(message);
    console.error('Query error:', error);
  };

  return { handleError };
};

// Query keys for consistent cache management
export const queryKeys = {
  // Auth
  auth: ['auth'],
  currentUser: ['currentUser'],
  
  // Patients
  patients: ['patients'],
  patient: (id) => ['patients', id],
  patientProfile: ['patientProfile'],
  
  // Doctors
  doctors: ['doctors'],
  doctor: (id) => ['doctors', id],
  doctorProfile: ['doctorProfile'],
  publicDoctors: ['publicDoctors'],
  
  // Appointments
  appointments: ['appointments'],
  myAppointments: ['myAppointments'],
  appointment: (id) => ['appointments', id],
  statusCounts: ['statusCounts'],
  availability: (doctorId, date, type) => ['availability', doctorId, date, type],
  
  // Billing
  invoices: ['invoices'],
  invoice: (id) => ['invoices', id],
  patientInvoices: (patientId) => ['invoices', patientId],
  
  // Inventory
  inventory: ['inventory'],
  inventoryItem: (id) => ['inventory', id],
  
  // EMR
  emrRecords: ['emr'],
  patientRecords: (patientId) => ['emr', patientId],
  emrRecord: (id) => ['emr', id],
  
  // Hospitals
  hospitals: ['hospitals'],
  hospital: (id) => ['hospitals', id],
  
  // Reports
  reports: ['reports'],
  appointmentStats: ['reports', 'appointmentStats'],
  inventorySummary: ['reports', 'inventorySummary'],
  patientDemographics: ['reports', 'patientDemographics'],
  financeSummary: ['reports', 'financeSummary'],
  
  // Notifications
  notifications: ['notifications'],
  
  // Users
  users: ['users'],
  user: (id) => ['users', id],
};
