import { useState } from 'react';
import { useSelector } from 'react-redux';
import AppointmentCard from './AppointmentCard';
import { sortAppointments, applyDateFilter } from '../../utils/appointmentDashboard';

const BUCKET_COLORS = {
  Pending:     { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',  header: 'border-amber-200' },
  Confirmed:   { dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200',     header: 'border-blue-200'  },
  'In Progress':{ dot: 'bg-teal-400',  badge: 'bg-teal-50 text-teal-700 border-teal-200',     header: 'border-teal-200'  },
  Completed:   { dot: 'bg-green-400',  badge: 'bg-green-50 text-green-700 border-green-200',  header: 'border-green-200' },
  Cancelled:   { dot: 'bg-slate-300',  badge: 'bg-slate-50 text-slate-500 border-slate-200',  header: 'border-slate-200' },
};

export default function StatusBucket({
  status,
  appointments = [],
  liveCount = 0,
  cumulativeCount = 0,
  isVideo = false,
  onStatusChange,
}) {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role;
  const isStaff = role === 'Admin' || role === 'Receptionist';

  const [dateFilter, setDateFilter] = useState('');

  const sorted   = sortAppointments(appointments);
  const filtered = applyDateFilter(sorted, dateFilter);

  const colors = BUCKET_COLORS[status] || BUCKET_COLORS.Pending;

  return (
    <div className="flex flex-col w-[280px] flex-shrink-0 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">

      {/* ── Column header ── */}
      <div className={`px-4 py-3 bg-white border-b ${colors.header}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
            <span className="font-semibold text-slate-700 text-sm">{status}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}>
              {liveCount}
            </span>
            <span className="text-[11px] text-slate-400">/ {cumulativeCount}</span>
          </div>
        </div>

        {/* Date filter */}
        {isStaff && (
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="mt-2.5 w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
            aria-label={`Filter ${status} by date`}
          />
        )}
      </div>

      {/* ── Card list ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[calc(100vh-230px)]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="text-xs text-slate-400">No {status.toLowerCase()} appointments</span>
          </div>
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
