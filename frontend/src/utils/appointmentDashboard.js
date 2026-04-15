/**
 * Pure utility functions for appointment status dashboard logic.
 * All functions are side-effect free and do not depend on external state.
 */

const DOCTOR_BUCKETS = ['In Progress', 'Completed', 'Cancelled'];
const STAFF_BUCKETS  = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

const ALL_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

/**
 * Returns the bucket label array for the given role.
 * Doctor gets 3 buckets; Admin/Receptionist get all 5.
 * @param {string} role
 * @returns {string[]}
 */
export function getBuckets(role) {
  if (role === 'Doctor') return DOCTOR_BUCKETS;
  return STAFF_BUCKETS;
}

/**
 * Counts appointments per status from an array.
 * Returns an object with all 5 statuses defaulting to 0.
 * @param {object[]} appointments
 * @returns {Record<string, number>}
 */
export function deriveLiveCounts(appointments) {
  const counts = { Pending: 0, Confirmed: 0, 'In Progress': 0, Completed: 0, Cancelled: 0 };
  for (const apt of appointments) {
    if (Object.prototype.hasOwnProperty.call(counts, apt.status)) {
      counts[apt.status]++;
    }
  }
  return counts;
}

/**
 * Derives cumulative counts from live counts using the lifecycle formula.
 * Pending = all, Confirmed = Confirmed+InProgress+Completed,
 * InProgress = InProgress+Completed, Completed = Completed, Cancelled = Cancelled.
 * @param {Record<string, number>} liveCounts
 * @returns {Record<string, number>}
 */
export function deriveCumulativeCounts(liveCounts) {
  const p  = liveCounts['Pending']     || 0;
  const c  = liveCounts['Confirmed']   || 0;
  const ip = liveCounts['In Progress'] || 0;
  const co = liveCounts['Completed']   || 0;
  const ca = liveCounts['Cancelled']   || 0;

  return {
    Pending:       p + c + ip + co + ca,
    Confirmed:     c + ip + co,
    'In Progress': ip + co,
    Completed:     co,
    Cancelled:     ca,
  };
}

/**
 * Filters appointments to those belonging to a specific doctor.
 * @param {object[]} appointments
 * @param {string} userId
 * @returns {object[]}
 */
export function filterByDoctor(appointments, userId) {
  return appointments.filter(apt => apt.doctorId === userId);
}

/**
 * Filters appointments by type ('clinic' or 'video').
 * @param {object[]} appointments
 * @param {string} type
 * @returns {object[]}
 */
export function filterByType(appointments, type) {
  return appointments.filter(apt => apt.type === type);
}

/**
 * Sorts appointments ascending by appointmentDate then appointmentTime.
 * Returns a new array; does not mutate the input.
 * @param {object[]} appointments
 * @returns {object[]}
 */
export function sortAppointments(appointments) {
  return [...appointments].sort((a, b) => {
    if (a.appointmentDate < b.appointmentDate) return -1;
    if (a.appointmentDate > b.appointmentDate) return  1;
    if (a.appointmentTime < b.appointmentTime) return -1;
    if (a.appointmentTime > b.appointmentTime) return  1;
    return 0;
  });
}

/**
 * Filters appointments by date. Returns all appointments when date is null/empty.
 * @param {object[]} appointments
 * @param {string|null} date  YYYY-MM-DD or null/empty string
 * @returns {object[]}
 */
export function applyDateFilter(appointments, date) {
  if (!date) return appointments;
  return appointments.filter(apt => apt.appointmentDate === date);
}

/**
 * Returns a new array with the matching appointment's status replaced.
 * All other appointments are unchanged.
 * @param {object[]} appointments
 * @param {string} id
 * @param {string} newStatus
 * @returns {object[]}
 */
export function applyStatusUpdate(appointments, id, newStatus) {
  return appointments.map(apt =>
    apt.id === id ? { ...apt, status: newStatus } : apt
  );
}

/**
 * Returns true iff the appointment is a video appointment AND its status
 * is 'Confirmed' or 'In Progress'.
 * @param {string} status
 * @param {boolean} isVideo
 * @returns {boolean}
 */
export function shouldShowJoinButton(status, isVideo) {
  return Boolean(isVideo && (status === 'Confirmed' || status === 'In Progress'));
}
