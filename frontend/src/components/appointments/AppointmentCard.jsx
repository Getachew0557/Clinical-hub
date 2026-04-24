import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { shouldShowJoinButton } from '../../utils/appointmentDashboard';
import { Video, User, Stethoscope, Clock, FileText } from 'lucide-react';

function getActions(role, status) {
  const isDoctor = role === 'Doctor';
  const isStaff  = role === 'Admin' || role === 'Receptionist';

  if (isDoctor) {
    if (status === 'Confirmed')   return [{ label: 'Start',    next: 'In Progress', variant: 'primary' }];
    if (status === 'In Progress') return [{ label: 'Complete', next: 'Completed',   variant: 'success' }];
  }

  if (isStaff) {
    if (status === 'Pending')     return [
      { label: 'Confirm',  next: 'Confirmed',   variant: 'primary' },
      { label: 'Cancel',   next: 'Cancelled',   variant: 'danger'  },
    ];
    if (status === 'Confirmed')   return [
      { label: 'Start',    next: 'In Progress', variant: 'primary' },
      { label: 'Cancel',   next: 'Cancelled',   variant: 'danger'  },
    ];
    if (status === 'In Progress') return [
      { label: 'Complete', next: 'Completed',   variant: 'success' },
      { label: 'Cancel',   next: 'Cancelled',   variant: 'danger'  },
    ];
  }

  return [];
}

// Truncate UUID to last 6 chars with # prefix
const shortId = (id) => id ? `#${String(id).slice(-6).toUpperCase()}` : '—';

const BTN = {
  primary: 'bg-teal-600 hover:bg-teal-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  danger:  'bg-red-500 hover:bg-red-600 text-white',
  video:   'bg-indigo-600 hover:bg-indigo-700 text-white',
};

export default function AppointmentCard({ appointment, role, isVideo, onStatusChange }) {
  const navigate = useNavigate();
  const [cardError, setCardError] = useState(null);
  const [busy, setBusy] = useState(false);

  const { id, patientName, patientId, phone, doctorName,
          appointmentDate, appointmentTime, reason, status,
          doctorSpecialization } = appointment;

  // For Patient role, patientName is their own name — use it directly
  // For staff, it comes enriched from backend
  const displayName = patientName || (role === 'Patient' ? null : 'Unknown Patient');

  const actions  = getActions(role, status);
  const showJoin = shouldShowJoinButton(status, isVideo);

  const handleAction = async (nextStatus) => {
    setCardError(null);
    setBusy(true);
    try {
      await onStatusChange(id, nextStatus);
    } catch (err) {
      setCardError(err?.response?.data?.message || err.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-teal-300 hover:shadow-md transition-all duration-200">

      {/* ── Top strip: name + badge ── */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {isVideo && <Video size={13} className="text-indigo-500 shrink-0" />}
            <span className="font-semibold text-slate-800 text-sm truncate">
              {displayName || <span className="text-slate-400 italic">Loading...</span>}
            </span>
          </div>
          {/* Short ID + phone on one line */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
              {shortId(patientId || id)}
            </span>
            {phone && (
              <span className="text-[11px] text-slate-400 truncate">{phone}</span>
            )}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* ── Meta rows ── */}
      <div className="px-4 pb-3 space-y-1.5">
        {/* Show doctor name for patient, show doctor for staff */}
        {role === 'Patient' && doctorName && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Stethoscope size={12} className="shrink-0 text-teal-500" />
            <span className="text-xs truncate">{doctorName}{doctorSpecialization ? ` · ${doctorSpecialization}` : ''}</span>
          </div>
        )}
        {(role === 'Admin' || role === 'Receptionist' || role === 'Doctor') && doctorName && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Stethoscope size={12} className="shrink-0 text-teal-500" />
            <span className="text-xs truncate">{doctorName}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock size={12} className="shrink-0" />
          <span className="text-xs">
            {appointmentDate}
            {appointmentTime && <span className="ml-1.5 text-slate-400">{appointmentTime}</span>}
          </span>
        </div>

        {reason && (
          <div className="flex items-start gap-1.5 text-slate-500">
            <FileText size={12} className="shrink-0 mt-0.5" />
            <span className="text-xs line-clamp-2 text-slate-600">{reason}</span>
          </div>
        )}

        {/* Confirmed by / confirmed at — shown for Confirmed, In Progress, Completed */}
        {['Confirmed', 'In Progress', 'Completed'].includes(status) && appointment.confirmedAt && (
          <div className="flex items-center gap-1.5 mt-1 px-2 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500 shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Confirmed</span>
              <span className="text-[11px] text-blue-700 font-medium truncate">
                {appointment.confirmedByName || 'Staff'}
                <span className="text-blue-400 font-normal ml-1">
                  · {new Date(appointment.confirmedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' '}
                  {new Date(appointment.confirmedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      {(actions.length > 0 || showJoin) && (
        <div className="px-3 pb-3 flex gap-2">
          {actions.map((action) => (
            <button
              key={action.next}
              disabled={busy}
              onClick={() => handleAction(action.next)}
              className={`flex-1 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${BTN[action.variant]}`}
            >
              {action.label}
            </button>
          ))}
          {showJoin && (
            <button
              onClick={() => navigate(`/video/${id}`)}
              className={`flex-1 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${BTN.video}`}
            >
              Join Call
            </button>
          )}
        </div>
      )}

      {cardError && (
        <p className="px-4 pb-3 text-[11px] text-red-500">{cardError}</p>
      )}
    </div>
  );
}
