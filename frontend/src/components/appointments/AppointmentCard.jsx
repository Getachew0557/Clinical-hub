import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { shouldShowJoinButton } from '../../utils/appointmentDashboard';

/**
 * Inline action buttons per role × status matrix (from design doc):
 *
 * Doctor + Confirmed     → "Start Consultation"  (→ In Progress)
 * Doctor + In Progress   → "Mark as Completed"   (→ Completed)
 * Admin/Recept + Pending → "Confirm", "Cancel"
 * Admin/Recept + Confirmed → "Start", "Cancel"
 * Admin/Recept + In Progress → "Complete", "Cancel"
 */
function getActions(role, status) {
  const isDoctor = role === 'Doctor';
  const isStaff  = role === 'Admin' || role === 'Receptionist';

  if (isDoctor) {
    if (status === 'Confirmed')   return [{ label: 'Start Consultation', next: 'In Progress', variant: 'primary' }];
    if (status === 'In Progress') return [{ label: 'Mark as Completed',  next: 'Completed',   variant: 'success' }];
  }

  if (isStaff) {
    if (status === 'Pending')     return [
      { label: 'Confirm', next: 'Confirmed',   variant: 'primary' },
      { label: 'Cancel',  next: 'Cancelled',   variant: 'danger'  },
    ];
    if (status === 'Confirmed')   return [
      { label: 'Start',   next: 'In Progress', variant: 'primary' },
      { label: 'Cancel',  next: 'Cancelled',   variant: 'danger'  },
    ];
    if (status === 'In Progress') return [
      { label: 'Complete', next: 'Completed',  variant: 'success' },
      { label: 'Cancel',   next: 'Cancelled',  variant: 'danger'  },
    ];
  }

  return [];
}

const VARIANT_CLASSES = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger:  'bg-red-600  hover:bg-red-700  text-white',
};

export default function AppointmentCard({ appointment, role, isVideo, onStatusChange }) {
  const navigate = useNavigate();
  const [cardError, setCardError] = useState(null);

  const {
    id,
    patientName,
    patientId,
    phone,
    doctorName,
    appointmentDate,
    appointmentTime,
    reason,
    status,
  } = appointment;

  const actions = getActions(role, status);
  const showJoin = shouldShowJoinButton(status, isVideo);

  const handleAction = async (nextStatus) => {
    setCardError(null);
    try {
      await onStatusChange(id, nextStatus);
    } catch (err) {
      setCardError(err?.response?.data?.message || err.message || 'Status update failed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-2">
      {/* Header row: patient info + video icon + badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            {isVideo && (
              <svg
                className="w-4 h-4 text-blue-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-label="Video consultation"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M4 8h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2z"
                />
              </svg>
            )}
            <span className="font-medium text-gray-900 text-sm">{patientName}</span>
          </div>
          {(patientId || phone) && (
            <p className="text-xs text-gray-500 mt-0.5">
              {patientId && <span>ID: {patientId}</span>}
              {patientId && phone && <span className="mx-1">·</span>}
              {phone && <span>{phone}</span>}
            </p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Doctor name — Admin/Receptionist only */}
      {(role === 'Admin' || role === 'Receptionist') && doctorName && (
        <p className="text-xs text-gray-600">
          <span className="font-medium">Doctor:</span> {doctorName}
        </p>
      )}

      {/* Date / time */}
      <p className="text-xs text-gray-600">
        {appointmentDate}
        {appointmentTime && <span className="ml-2">{appointmentTime}</span>}
      </p>

      {/* Reason */}
      {reason && (
        <p className="text-xs text-gray-700 line-clamp-2">{reason}</p>
      )}

      {/* Action buttons */}
      {(actions.length > 0 || showJoin) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {actions.map((action) => (
            <button
              key={action.next}
              onClick={() => handleAction(action.next)}
              className={`text-xs px-3 py-1 rounded font-medium transition-colors ${VARIANT_CLASSES[action.variant]}`}
            >
              {action.label}
            </button>
          ))}

          {showJoin && (
            <button
              onClick={() => navigate(`/video/${id}`)}
              className="text-xs px-3 py-1 rounded font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Join Video Call
            </button>
          )}
        </div>
      )}

      {/* Inline error */}
      {cardError && (
        <p className="text-xs text-red-600 mt-1">{cardError}</p>
      )}
    </div>
  );
}
