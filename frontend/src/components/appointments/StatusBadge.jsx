/**
 * StatusBadge — small pill badge showing appointment status with color coding.
 *
 * Color mapping (per design):
 *   Pending     → gray
 *   Confirmed   → blue
 *   In Progress → amber
 *   Completed   → green
 *   Cancelled   → red
 */

const COLOR_MAP = {
  Pending:       'bg-gray-100 text-gray-700',
  Confirmed:     'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  Completed:     'bg-green-100 text-green-700',
  Cancelled:     'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }) {
  const classes = COLOR_MAP[status] ?? 'bg-gray-100 text-gray-700';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}
    >
      {status}
    </span>
  );
}
