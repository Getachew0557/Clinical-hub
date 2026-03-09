import { Op } from 'sequelize';
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
        const { doctorId, patientId, appointmentDate, appointmentTime, reason, notes } = req.body;

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
 * ?date=YYYY-MM-DD
 * Calculates 30-min slots from 08:00 to 18:00.
 * Slot is unavailable if count >= 2.
 */
export const getAvailability = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({ message: 'doctorId and date are required' });
        }

        // Get all appointments for this doctor on this date
        const appointments = await Appointment.findAll({
            where: {
                doctorId,
                appointmentDate: date,
                status: { [Op.ne]: 'Cancelled' }
            }
        });

        // Configurable limits
        const startHour = 8;
        const endHour = 18;
        const slotDuration = 30; // minutes
        const maxPatientsPerSlot = 2;

        const slots = [];
        let current = moment(date).hour(startHour).minute(0).second(0);
        const end = moment(date).hour(endHour).minute(0).second(0);

        while (current.isBefore(end)) {
            const timeStr = current.format('HH:mm:ss');
            const slotAppointments = appointments.filter(a => a.appointmentTime === timeStr);

            slots.push({
                time: current.format('HH:mm'),
                timeValue: timeStr,
                available: slotAppointments.length < maxPatientsPerSlot,
                bookedCount: slotAppointments.length,
                remainingSpots: maxPatientsPerSlot - slotAppointments.length
            });

            current.add(slotDuration, 'minutes');
        }

        res.status(200).json({ slots });
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
        const { status, date } = req.query;
        const where = {};

        if (status) where.status = status;
        if (date) where.appointmentDate = date;

        const appointments = await Appointment.findAll({
            where,
            order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
        });

        res.status(200).json({ count: appointments.length, appointments });
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

        // ─── If Doctor, append Patient Details ───
        if (req.user.role === 'Doctor' || req.user.role === 'Admin') {
            const authHeader = { headers: { Authorization: req.headers.authorization } };
            const patientUrl = process.env.PATIENT_SERVICE_URL;

            const patientsRes = await axios.get(patientUrl, authHeader).catch(() => ({ data: { patients: [] } }));
            const patientsList = patientsRes.data.patients || [];

            const enriched = appointments.map(apt => {
                const patient = patientsList.find(p => p.id === apt.patientId || p.userId === apt.patientId);
                return {
                    ...apt.toJSON(),
                    patientName: patient ? patient.fullName : 'Guest Patient',
                    patientDetails: patient || null
                };
            });
            return res.status(200).json({ count: appointments.length, appointments: enriched });
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
