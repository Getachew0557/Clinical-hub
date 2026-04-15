import React from 'react';
import { useSelector } from 'react-redux';
import { Alert, Button, Typography } from '@mui/material';
import { Video } from 'lucide-react';
import useStatusDashboard from '../../hooks/useStatusDashboard';
import StatusBucket from '../../components/appointments/StatusBucket';
import { getBuckets } from '../../utils/appointmentDashboard';

export default function VideoStatusDashboard() {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role;
  const userId = user?.id;

  const { appointments, counts, loading, error, handleStatusChange, refetch } =
    useStatusDashboard({ type: 'video', role, userId });

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
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
          <Video className="text-teal-600 w-5 h-5" />
        </div>
        <div>
          <Typography variant="h5" color="text.primary">
            Video Consultations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Manage your video consultation sessions
          </Typography>
        </div>
      </div>

      {/* Error banner (non-fatal) */}
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
            Loading video consultations…
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
                isVideo={true}
                onStatusChange={handleStatusChange}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
