import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Button, Typography, Box } from '@mui/material';
import { CalendarPlus } from 'lucide-react';
import useStatusDashboard from '../../hooks/useStatusDashboard';
import StatusBucket from '../../components/appointments/StatusBucket';
import { getBuckets } from '../../utils/appointmentDashboard';
import BookAppointmentModal from '../../components/appointments/BookAppointmentModal';

export default function StatusDashboard() {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role;
  const userId = user?.id;

  const { appointments, counts, loading, error, handleStatusChange, refetch } =
    useStatusDashboard({ role, userId });

  const [bookModalOpen, setBookModalOpen] = useState(false);

  const isStaff = role === 'Admin' || role === 'Receptionist';
  const isPatient = role === 'Patient';
  const canBook = isStaff || isPatient;
  const buckets = getBuckets(role);

  if (error && !loading && appointments.length === 0) {
    return (
      <div className="p-6">
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
      <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <Typography variant="h5" color="text.primary">
            Appointments
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {isStaff ? 'Manage all appointments' : 'Your appointment schedule'}
          </Typography>
        </div>
        {canBook && (
          <Button
            variant="contained"
            startIcon={<CalendarPlus size={18} />}
            onClick={() => setBookModalOpen(true)}
            sx={{ borderRadius: 3 }}
          >
            Book Appointment
          </Button>
        )}
      </div>

      {/* Error banner (non-fatal, data still loaded) */}
      {error && appointments.length > 0 && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              Retry
            </Button>
          }
          sx={{ flexShrink: 0 }}
        >
          {error}
        </Alert>
      )}

      {/* Horizontally scrollable bucket row */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {loading && appointments.length === 0 ? (
          <div className="flex items-center justify-center w-full py-20 text-slate-400">
            Loading appointments…
          </div>
        ) : (
          buckets.map((status) => {
            const bucketAppointments = appointments.filter(
              (apt) => apt.status === status
            );
            const statusCounts = counts[status] || { live: 0, cumulative: 0 };
            return (
              <StatusBucket
                key={status}
                status={status}
                appointments={bucketAppointments}
                liveCount={statusCounts.live}
                cumulativeCount={statusCounts.cumulative}
                isVideo={false}
                onStatusChange={handleStatusChange}
              />
            );
          })
        )}
      </div>

      {/* Book Appointment Modal */}
      {canBook && (
        <BookAppointmentModal
          open={bookModalOpen}
          onClose={() => setBookModalOpen(false)}
          onSuccess={() => {
            setBookModalOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  </Box>
  );
}
