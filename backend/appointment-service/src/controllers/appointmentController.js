import { Op, fn, col } from 'sequelize';
import Appointment from '../models/Appointment.js';
import moment from 'moment';
import axios from 'axios';

// ─── Helper ────────────────────────────────────────────────────────────────
const PATIENT_EDITABLE_STATUSES = ['Pending'];

// ─── CREATE ────────────────────────────────────────────────────────────────

/**
 * POST /api/appointments
 * Any authenticated user can create.
 * Patients can only book for themselves (patientId is forced to req.user.id).
 * Admin / Receptionist / Doctor can specify any patientId.
 */
export const createAppointment = async (req, res) => {
    try {
        const { doctorId, patientId, appointmentDate, appointmentTime, reason, notes, type } = req.body;

        // Patients can only create appointments for themselves
        const resolvedPatientId =
            req.user.role === 'Patient' ? req.user.id : patientId;

        if (!resolvedPatientId) {
            return res.status(400).json({ message: 'patientId is required' });
        }
        if (!doctorId || !appointmentDate || !appointmentTime || !reason) {
            return res.status(400).json({ message: 'doctorId, appointmentDate, appointmentTime, and reason are required' });
        }

        const appointment = await Appointment.create({
            patientId: resolvedPatientId,
            doctorId,
            appointmentDate,
            appointmentTime,
            reason,
            notes: notes || null,
            type: type || 'clinic',
            createdBy: req.user.id,
            isAdminApproved: ['Admin', 'Receptionist', 'Doctor'].includes(req.user.role)
        });

        // ─── TRIGGER NOTIFICATIONS ──────────────────────────────────────────
        try {
            const authHeader = { headers: { Authorization: req.headers.authorization } };
            const notifyUrl = process.env.NOTIFICATION_SERVICE_URL;
            const doctorUrl = process.env.DOCTOR_SERVICE_URL;
            const patientUrl = process.env.PATIENT_SERVICE_URL;

            // Fetch Doctor and Patient names for better messages
            const [docRes, patRes] = await Promise.all([
                axios.get(`${doctorUrl}/${doctorId}`, authHeader).catch(() => ({ data: { fullName: 'Doctor' } })),
                axios.get(`${patientUrl}/${resolvedPatientId}`, authHeader).catch(() => ({ data: { fullName: 'Patient' } }))
            ]);

            const doctorName = docRes.data.fullName || 'Doctor';
            const patientName = patRes.data.fullName || 'Patient';

            // Notify Patient
            await axios.post(notifyUrl, {
                userId: resolvedPatientId,
                title: 'Appointment Booked',
                message: `Your appointment with ${doctorName} is confirmed for ${appointmentDate} at ${appointmentTime}.`,
                type: 'info',
                link: '/appointments'
            }, authHeader).catch(err => console.error('Patient Notification Error:', err.message));

            // Notify Doctor
            await axios.post(notifyUrl, {
                userId: doctorId,
                title: 'New Appointment',
                message: `New booking received from ${patientName} for ${appointmentDate} at ${appointmentTime}.`,
                type: 'info',
                link: '/appointments'
            }, authHeader).catch(err => console.error('Doctor Notification Error:', err.message));

        } catch (notifyError) {
            console.error('Core Notification Logic Error:', notifyError.message);
        }

        res.status(201).json({
            message: 'Appointment created successfully',
            appointment
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/appointments/availability/:doctorId
 * ?date=YYYY-MM-DD  &type=clinic|video
 * Generates 30-min slots based on doctor's working hours.
 * Slot capacity = maxPatientsPerHour / 2 (default 10/hr → 5 per slot).
 * Fetches doctor working hours from doctor-service.
 */
export const getAvailability = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date, type } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({ message: 'doctorId and date are required' });
        }

        // ── Fetch doctor working hours from doctor-service ──────────────────
        let startHour = 8;
        let endHour = 18;
        let maxPatientsPerHour = 10; // default: 10 patients per hour
        let workingDays = null;
        let docSlotDuration = 30;
        let docBreakStart = null;
        let docBreakEnd = null;
        let docServiceTypes = ['clinic', 'video'];

        try {
            const doctorUrl = process.env.DOCTOR_SERVICE_URL;
            // Use auth header if available, otherwise try public endpoint
            const authHeader = req.headers.authorization
                ? { headers: { Authorization: req.headers.authorization } }
                : {};
            let docRes;
            try {
                docRes = await axios.get(`${doctorUrl}/public`, { params: { search: '' } });
                const docs = docRes.data.doctors || docRes.data.records || [];
                const doc = docs.find(d => d.id === doctorId);
                if (doc) {
                    if (doc.workingHoursStart) startHour = parseInt(doc.workingHoursStart.split(':')[0], 10);
                    if (doc.workingHoursEnd) endHour = parseInt(doc.workingHoursEnd.split(':')[0], 10);
                    if (doc.maxPatientsPerHour) maxPatientsPerHour = parseInt(doc.maxPatientsPerHour, 10);
                    if (doc.workingDays) workingDays = Array.isArray(doc.workingDays) ? doc.workingDays : JSON.parse(doc.workingDays);
                    if (doc.slotDuration) docSlotDuration = parseInt(doc.slotDuration, 10);
                    if (doc.breakStart) docBreakStart = doc.breakStart;
                    if (doc.breakEnd) docBreakEnd = doc.breakEnd;
                    if (doc.serviceTypes) docServiceTypes = Array.isArray(doc.serviceTypes) ? doc.serviceTypes : JSON.parse(doc.serviceTypes);
                }
            } catch {
                // Fall back to authenticated endpoint
                docRes = await axios.get(`${doctorUrl}/${doctorId}`, authHeader);
                const doc = docRes.data;
                if (doc.workingHoursStart) startHour = parseInt(doc.workingHoursStart.split(':')[0], 10);
                if (doc.workingHoursEnd) endHour = parseInt(doc.workingHoursEnd.split(':')[0], 10);
                if (doc.maxPatientsPerHour) maxPatientsPerHour = parseInt(doc.maxPatientsPerHour, 10);
                if (doc.workingDays) workingDays = Array.isArray(doc.workingDays) ? doc.workingDays : JSON.parse(doc.workingDays);
                if (doc.slotDuration) docSlotDuration = parseInt(doc.slotDuration, 10);
                if (doc.breakStart) docBreakStart = doc.breakStart;
                if (doc.breakEnd) docBreakEnd = doc.breakEnd;
                if (doc.serviceTypes) docServiceTypes = Array.isArray(doc.serviceTypes) ? doc.serviceTypes : JSON.parse(doc.serviceTypes);
            }
        } catch (err) {
            console.warn('Could not fetch doctor working hours, using defaults:', err.message);
        }

        // ── Check if requested service type is offered by this doctor ───────
        if (type && type !== 'all' && docServiceTypes.length > 0 && !docServiceTypes.includes(type)) {
            return res.status(200).json({
                slots: [],
                message: `This doctor does not offer ${type} consultations`,
                serviceTypes: docServiceTypes
            });
        }

        // ── Check if the requested date is a working day ────────────────────
        if (workingDays && workingDays.length > 0) {
            const dayName = moment(date).format('dddd'); // e.g. "Monday"
            if (!workingDays.includes(dayName)) {
                return res.status(200).json({ slots: [], message: `Doctor does not work on ${dayName}` });
            }
        }

        // ── Get existing appointments for this doctor/date/type ─────────────
        const whereClause = {
            doctorId,
            appointmentDate: date,
            status: { [Op.ne]: 'Cancelled' }
        };
        // If type is specified, filter by type (clinic vs video)
        if (type && type !== 'all') {
            whereClause.type = type;
        }

        const appointments = await Appointment.findAll({ where: whereClause });

        // ── Generate slots ──────────────────────────────────────────────────
        const slotDurationMins = docSlotDuration || 30;
        const maxPatientsPerSlot = Math.ceil(maxPatientsPerHour / (60 / slotDurationMins));

        const slots = [];
        let current = moment(date).hour(startHour).minute(0).second(0);
        const end = moment(date).hour(endHour).minute(0).second(0);

        while (current.isBefore(end)) {
            const timeStr = current.format('HH:mm:ss');

            // Skip break time slots
            if (docBreakStart && docBreakEnd) {
                const slotMins = current.hour() * 60 + current.minute();
                const breakStartMins = parseInt(docBreakStart.split(':')[0]) * 60 + parseInt(docBreakStart.split(':')[1]);
                const breakEndMins = parseInt(docBreakEnd.split(':')[0]) * 60 + parseInt(docBreakEnd.split(':')[1]);
                if (slotMins >= breakStartMins && slotMins < breakEndMins) {
                    current.add(slotDurationMins, 'minutes');
                    continue;
                }
            }

            const slotAppointments = appointments.filter(a => a.appointmentTime === timeStr);
            const bookedCount = slotAppointments.length;
            const remaining = maxPatientsPerSlot - bookedCount;

            slots.push({
                time: current.format('HH:mm'),
                timeValue: timeStr,
                available: remaining > 0,
                bookedCount,
                remainingSpots: Math.max(0, remaining),
                maxSpots: maxPatientsPerSlot,
            });

            current.add(slotDurationMins, 'minutes');
        }

        res.status(200).json({ slots, maxPatientsPerHour, slotDuration: slotDurationMins, serviceTypes: docServiceTypes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── READ ALL ──────────────────────────────────────────────────────────────

/**
 * GET /api/appointments
 * Admin & Receptionist: see every appointment.
 * (Route guard handles the role restriction — this handler trusts it.)
 */
export const getAllAppointments = async (req, res) => {
    try {
        const { status, date, doctorId } = req.query;
        const where = {};

        if (status) where.status = status;
        if (date) where.appointmentDate = date;
        if (doctorId) where.doctorId = doctorId;

        const appointments = await Appointment.findAll({
            where,
            order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
        });

        // ─── Enrich with Patient Names ───
        const authHeader = { headers: { Authorization: req.headers.authorization } };
        const patientUrl = process.env.PATIENT_SERVICE_URL;

        const patientsRes = await axios.get(patientUrl, authHeader).catch(() => ({ data: { patients: [] } }));
        const patientsList = patientsRes.data.patients || [];

        // Also fetch doctor names for Admin/Receptionist
        let doctorsList = [];
        try {
            const doctorUrl = process.env.DOCTOR_SERVICE_URL;
            const docRes = await axios.get(`${doctorUrl}/public`, { params: { search: '' } }).catch(() => ({ data: { doctors: [] } }));
            doctorsList = docRes.data.doctors || docRes.data.records || [];
        } catch { /* use empty list */ }

        const enriched = appointments.map(apt => {
            const patient = patientsList.find(p =>
                p.userId === apt.patientId || p.id === apt.patientId ||
                String(p.userId) === String(apt.patientId) || String(p.id) === String(apt.patientId)
            );
            const doctor = doctorsList.find(d =>
                d.userId === apt.doctorId || d.id === apt.doctorId ||
                String(d.userId) === String(apt.doctorId) || String(d.id) === String(apt.doctorId)
            );
            return {
                ...apt.toJSON(),
                patientName: patient ? (patient.fullName || patient.name) : null,
                doctorName: doctor ? (doctor.fullName || doctor.name) : null,
                patientDetails: patient || null
            };
        });

        res.status(200).json({ count: appointments.length, appointments: enriched });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── READ MINE ─────────────────────────────────────────────────────────────

/**
 * GET /api/appointments/my
 * Returns appointments where the logged-in user is either the patient or the doctor.
 */
export const getMyAppointments = async (req, res) => {
    try {
        const where = {
            [Op.or]: [
                { patientId: req.user.id },
                { doctorId: req.user.id }
            ]
        };

        // If Doctor, only show Pending if approved. (But show all non-pending regardless of approval)
        if (req.user.role === 'Doctor') {
            where[Op.and] = [
                {
                    [Op.or]: [
                        { status: { [Op.ne]: 'Pending' } },
                        { isAdminApproved: true }
                    ]
                }
            ];
        }

        const appointments = await Appointment.findAll({
            where,
            order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
        });

        // ─── If Staff/Admin, append Patient + Doctor Details ───
        if (['Doctor', 'Admin', 'Receptionist'].includes(req.user.role)) {
            const authHeader = { headers: { Authorization: req.headers.authorization } };
            const patientUrl = process.env.PATIENT_SERVICE_URL;
            const doctorUrl = process.env.DOCTOR_SERVICE_URL;

            const [patientsRes, doctorsRes] = await Promise.all([
                axios.get(patientUrl, authHeader).catch(() => ({ data: { patients: [] } })),
                axios.get(`${doctorUrl}/public`, { params: { search: '' } }).catch(() => ({ data: { doctors: [] } }))
            ]);
            const patientsList = patientsRes.data.patients || [];
            const doctorsList = doctorsRes.data.doctors || doctorsRes.data.records || [];

            const enriched = appointments.map(apt => {
                const patient = patientsList.find(p =>
                    p.id === apt.patientId || p.userId === apt.patientId ||
                    String(p.id) === String(apt.patientId) || String(p.userId) === String(apt.patientId)
                );
                const doctor = doctorsList.find(d =>
                    d.userId === apt.doctorId || d.id === apt.doctorId ||
                    String(d.userId) === String(apt.doctorId) || String(d.id) === String(apt.doctorId)
                );
                return {
                    ...apt.toJSON(),
                    patientName: patient ? (patient.fullName || patient.name) : null,
                    doctorName: doctor ? (doctor.fullName || doctor.name) : null,
                    patientDetails: patient || null
                };
            });
            return res.status(200).json({ count: appointments.length, appointments: enriched });
        }

        // ─── For Patient role, enrich with Doctor name AND own name ───
        if (req.user.role === 'Patient') {
            const authHeader = { headers: { Authorization: req.headers.authorization } };
            const doctorUrl = process.env.DOCTOR_SERVICE_URL;
            const patientUrl = process.env.PATIENT_SERVICE_URL;
            try {
                const [doctorsRes, patientRes] = await Promise.all([
                    axios.get(`${doctorUrl}/public`, {}).catch(() => ({ data: { doctors: [] } })),
                    axios.get(`${patientUrl}/${req.user.id}`, authHeader).catch(() => ({ data: null }))
                ]);
                const doctorsList = doctorsRes.data.doctors || [];
                const patientProfile = patientRes.data;
                const patientName = patientProfile?.fullName || null;

                const enriched = appointments.map(apt => {
                    const doctor = doctorsList.find(d => d.userId === apt.doctorId || d.id === apt.doctorId);
                    return {
                        ...apt.toJSON(),
                        patientName: patientName,
                        doctorName: doctor ? doctor.fullName : 'Doctor',
                        doctorSpecialization: doctor ? doctor.specialization : null,
                    };
                });
                return res.status(200).json({ count: appointments.length, appointments: enriched });
            } catch {
                // fall through to plain return
            }
        }

        res.status(200).json({ count: appointments.length, appointments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── READ ONE ──────────────────────────────────────────────────────────────

/**
 * GET /api/appointments/:id
 * Admin & Receptionist can view any.
 * Doctor & Patient can only view if they are the doctor/patient on that appointment.
 */
export const getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const { role, id: userId } = req.user;
        const isOwner =
            appointment.patientId === userId || appointment.doctorId === userId;

        if (!['Admin', 'Receptionist'].includes(role) && !isOwner) {
            return res.status(403).json({ message: 'Not authorized to view this appointment' });
        }

        res.status(200).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── UPDATE STATUS ─────────────────────────────────────────────────────────

/**
 * PATCH /api/appointments/:id/status
 * Admin, Doctor, Receptionist can update status.
 * Valid transitions: Pending → Confirmed | Cancelled; Confirmed → Completed | Cancelled
 */
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const previousStatus = appointment.status;
        appointment.status = status;
        await appointment.save();

        // ─── TRIGGER NOTIFICATIONS ON STATUS CHANGE ───
        try {
            const authHeader = { headers: { Authorization: req.headers.authorization } };
            const notifyUrl = process.env.NOTIFICATION_SERVICE_URL;
            if (notifyUrl) {
                // Notify Patient about status change
                await axios.post(notifyUrl, {
                    userId: appointment.patientId,
                    title: 'Appointment Status Updated',
                    message: `Your appointment status has changed to: ${status}.`,
                    type: status === 'Cancelled' ? 'error' : 'info',
                    link: '/appointments'
                }, authHeader).catch(err => console.error('Patient Status Notify Error:', err.message));

                // If Cancelled, notify Doctor too
                if (status === 'Cancelled') {
                    await axios.post(notifyUrl, {
                        userId: appointment.doctorId,
                        title: 'Appointment Cancelled',
                        message: `The appointment for patient ID ${appointment.patientId.slice(-6)} has been cancelled.`,
                        type: 'warning',
                        link: '/appointments'
                    }, authHeader).catch(err => console.error('Doctor Cancel Notify Error:', err.message));
                }
            }
        } catch (err) {
            console.error('Notification Trigger Failed:', err.message);
        }

        // ─── AUTOMATION: Auto-Invoice on Completion ───
        if (status === 'Completed' && previousStatus !== 'Completed') {
            try {
                const billingUrl = `${process.env.BILLING_SERVICE_URL}/invoices`;
                const authHeader = { headers: { Authorization: req.headers.authorization } };
                const doctorUrl = process.env.DOCTOR_SERVICE_URL;

                // Fetch doctor's actual consultation fee
                let consultationFee = 150.00;
                try {
                    const docRes = await axios.get(`${doctorUrl}/${appointment.doctorId}`, authHeader);
                    consultationFee = parseFloat(docRes.data.consultationFee) || 150.00;
                } catch { /* use default */ }

                await axios.post(billingUrl, {
                    appointmentId: appointment.id,
                    patientId: appointment.patientId,
                    doctorId: appointment.doctorId,
                    amount: consultationFee,
                    description: `Clinical Consultation - ${appointment.reason || 'Routine Checkup'}`,
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }, authHeader);
                console.log(`Auto-invoice generated for completed appointment ${appointment.id} — ETB ${consultationFee}`);
            } catch (err) {
                console.error('Failed to generate auto-invoice:', err.message);
            }
        }

        res.status(200).json({
            message: `Status updated from '${previousStatus}' to '${status}'`,
            appointment
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * PATCH /api/appointments/:id/approve
 * Admin & Receptionist only.
 */
export const approveAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.isAdminApproved = true;
        await appointment.save();

        // ─── TRIGGER NOTIFICATION ON APPROVAL ───
        try {
            const authHeader = { headers: { Authorization: req.headers.authorization } };
            const notifyUrl = process.env.NOTIFICATION_SERVICE_URL;
            if (notifyUrl) {
                await axios.post(notifyUrl, {
                    userId: appointment.patientId,
                    title: 'Appointment Approved',
                    message: 'Your appointment has been approved by the clinic administration.',
                    type: 'success',
                    link: '/appointments'
                }, authHeader).catch(err => console.error('Approval Notify Error:', err.message));
            }
        } catch (err) {
            console.error('Approval Notification Trigger Failed:', err.message);
        }

        res.status(200).json({
            message: 'Appointment approved by admin/receptionist',
            appointment
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── UPDATE / RESCHEDULE ───────────────────────────────────────────────────

/**
 * PUT /api/appointments/:id
 * Admin & Receptionist: can update any field.
 * Doctor: can update notes on their own appointments.
 * Patient: can only reschedule their own PENDING appointments (date/time/reason).
 */
export const updateAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const { role, id: userId } = req.user;

        if (role === 'Patient') {
            // Patients can only edit their own appointments
            if (appointment.patientId !== userId) {
                return res.status(403).json({ message: 'Not authorized to edit this appointment' });
            }
            // Patients can only reschedule PENDING appointments
            if (appointment.status !== 'Pending') {
                return res.status(400).json({
                    message: 'You can only reschedule appointments that are still Pending'
                });
            }
            // Patients can only change date, time, and reason
            const { appointmentDate, appointmentTime, reason } = req.body;
            if (appointmentDate) appointment.appointmentDate = appointmentDate;
            if (appointmentTime) appointment.appointmentTime = appointmentTime;
            if (reason) appointment.reason = reason;

        } else if (role === 'Doctor') {
            // Doctors can update notes on their own appointments
            if (appointment.doctorId !== userId) {
                return res.status(403).json({ message: 'Not authorized to edit this appointment' });
            }
            const { notes } = req.body;
            if (notes !== undefined) appointment.notes = notes;

        } else {
            // Admin / Receptionist — full update
            const { patientId, doctorId, appointmentDate, appointmentTime, reason, notes, status } = req.body;
            if (patientId) appointment.patientId = patientId;
            if (doctorId) appointment.doctorId = doctorId;
            if (appointmentDate) appointment.appointmentDate = appointmentDate;
            if (appointmentTime) appointment.appointmentTime = appointmentTime;
            if (reason) appointment.reason = reason;
            if (notes !== undefined) appointment.notes = notes;
            if (status) appointment.status = status;
        }

        await appointment.save();
        res.status(200).json({ message: 'Appointment updated successfully', appointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── STATUS COUNTS ─────────────────────────────────────────────────────────

/**
 * GET /api/appointments/status-counts
 * Returns live + cumulative counts per status for the dashboard.
 * Doctor: scoped to their own appointments.
 * Admin/Receptionist: all appointments.
 * Optional ?type=clinic|video filter.
 */
export const getStatusCounts = async (req, res) => {
    try {
        const { type } = req.query;
        const where = {};

        if (req.user.role === 'Doctor') {
            where.doctorId = req.user.id;
        }
        if (type && ['clinic', 'video'].includes(type)) {
            where.type = type;
        }

        const rows = await Appointment.findAll({
            where,
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            group: ['status'],
            raw: true
        });

        // Build live counts, defaulting all to 0
        const live = { Pending: 0, Confirmed: 0, 'In Progress': 0, Completed: 0, Cancelled: 0 };
        rows.forEach(r => {
            if (live.hasOwnProperty(r.status)) {
                live[r.status] = parseInt(r.count, 10);
            }
        });

        // Derive cumulative counts (no audit table needed)
        const cumulative = {
            Pending:       live.Pending + live.Confirmed + live['In Progress'] + live.Completed + live.Cancelled,
            Confirmed:     live.Confirmed + live['In Progress'] + live.Completed,
            'In Progress': live['In Progress'] + live.Completed,
            Completed:     live.Completed,
            Cancelled:     live.Cancelled,
        };

        const counts = {};
        Object.keys(live).forEach(status => {
            counts[status] = { live: live[status], cumulative: cumulative[status] };
        });

        res.status(200).json(counts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── DELETE ────────────────────────────────────────────────────────────────

/**
 * DELETE /api/appointments/:id
 * Admin only.
 */
export const deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        await appointment.destroy();
        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
