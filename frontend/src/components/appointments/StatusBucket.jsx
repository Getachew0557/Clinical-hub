import { useState } from 'react';
import { useSelector } from 'react-redux';
import AppointmentCard from './AppointmentCard';
import { sortAppointments, applyDateFilter } from '../../utils/appointmentDashboard';

/**
 * StatusBucket — one column in the kanban-style status dashboard.
 *
 * Props:
 *   status          {string}    e.g. "Pending"
 *   appointments    {object[]}  appointments already filtered to this status
 *   liveCount       {number}    current live count for the header badge
 *   cumulativeCount {number}    cumulative count for the header
 *   isVideo         {boolean}   whether this is the video dashboard
 *   onStatusChange  {Function}  (id, newStatus) => Promise<void>
 *   onError         {Function}  (message) => void  — optional bucket-level error handler
 */
export default function StatusBucket({
  status,
  appointments = [],
  liveCount = 0,
  cumulativeCount = 0,
  isVideo = false,
  onStatusChange,
  onError,
}) {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role;

  const isStaff = role === 'Admin' || role === 'Receptionist';

  const [dateFilter, setDateFilter] = useState('');

  // Apply sort then date filter
  const sorted   = sortAppointments(appointments);
  const filtered = applyDateFilter(sorted, dateFilter);

  const emptyMessage = isVideo ? 'No video consultations' : 'No appointments';

  return (
    <div className="flex flex-col w-72 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200">
      {/* Bucket header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-gray-800 text-sm">{status}</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              Now: {liveCount}
            </span>
            <span className="text-xs text-gray-500">Total: {cumulativeCount}</span>
          </div>
        </div>

        {/* Date filter — Admin/Receptionist only */}
        {isStaff && (
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="mt-2 w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
            aria-label={`Filter ${status} appointments by date`}
          />
        )}
      </div>

      {/* Scrollable card list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-220px)]">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">{emptyMessage}</p>
        ) : (
          filtered.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              role={role}
              isVideo={isVideo}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
