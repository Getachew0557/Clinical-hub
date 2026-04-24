import { useState, useCallback, useEffect } from 'react';
import appointmentService from '../api/appointment.service';
import {
  deriveLiveCounts,
  deriveCumulativeCounts,
  applyStatusUpdate,
} from '../utils/appointmentDashboard';
import useInterval from './useInterval';

/**
 * Hook that drives the StatusDashboard and VideoStatusDashboard pages.
 *
 * @param {{ type?: 'clinic'|'video', role: string, userId: string }} options
 * @returns {{
 *   appointments: object[],
 *   counts: Record<string, { live: number, cumulative: number }>,
 *   loading: boolean,
 *   error: string|null,
 *   handleStatusChange: (id: string, newStatus: string) => Promise<void>,
 *   refetch: () => void,
 * }}
 */
export default function useStatusDashboard({ type, role, userId } = {}) {
  const [appointments, setAppointments] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derive counts object from an appointments array
  const buildCounts = useCallback((apts) => {
    const live = deriveLiveCounts(apts);
    const cumulative = deriveCumulativeCounts(live);
    const result = {};
    Object.keys(live).forEach((status) => {
      result[status] = { live: live[status], cumulative: cumulative[status] };
    });
    return result;
  }, []);

  // Fetch the full appointment list
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = type ? { type } : {};
      const isStaff = role === 'Admin' || role === 'Receptionist';
      // Patient and Doctor use getMyAppointments (scoped to their own)
      // Admin/Receptionist use getAllAppointments (all appointments)
      const data = isStaff
        ? await appointmentService.getAllAppointments(params)
        : await appointmentService.getMyAppointments();

      // Both endpoints return { appointments: [...] }
      const apts = Array.isArray(data) ? data : (data.appointments || []);
      // For video dashboard, filter by type client-side since getMyAppointments doesn't support type param
      const filtered = type ? apts.filter(a => a.type === type) : apts;
      setAppointments(filtered);
      setCounts(buildCounts(filtered));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [type, role, buildCounts]);

  // Run once on mount
  useEffect(() => {
    fetchAppointments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll status counts every 30 seconds (staff only — Patient uses local counts)
  useInterval(async () => {
    try {
      const isStaff = role === 'Admin' || role === 'Receptionist' || role === 'Doctor';
      if (!isStaff) return;
      const params = type ? { type } : {};
      const data = await appointmentService.getStatusCounts(params);
      setCounts(data);
    } catch {
      // Retain stale counts on polling failure
    }
  }, 30000);

  /**
   * Update a single appointment's status, then re-fetch to get
   * enriched data (patientName, confirmedByName, confirmedAt).
   */
  const handleStatusChange = useCallback(async (id, newStatus) => {
    // Optimistic update for instant UI feedback
    const previousAppointments = appointments;
    const previousCounts = counts;
    const updated = applyStatusUpdate(appointments, id, newStatus);
    setAppointments(updated);
    setCounts(buildCounts(updated));

    try {
      await appointmentService.updateStatus(id, newStatus);
      // Re-fetch to get server-enriched data (patientName, confirmedByName, confirmedAt)
      await fetchAppointments();
    } catch (err) {
      // Revert on failure
      setAppointments(previousAppointments);
      setCounts(previousCounts);
      throw err;
    }
  }, [appointments, counts, buildCounts, fetchAppointments]);

  return {
    appointments,
    counts,
    loading,
    error,
    handleStatusChange,
    refetch: fetchAppointments,
  };
}
