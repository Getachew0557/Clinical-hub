import { Op, fn, col } from 'sequelize';
import Appointment from '../models/Appointment.js';
import moment from 'moment';
import axios from 'axios';

// ─── Helper ────────────────────────────────────────────────────────────────
const PATIENT_EDITABLE_STATUSES = ['Pending'];

// Internal notification helper — uses /internal endpoint (no auth required)
const notify = (notifyUrl, payload) => {
    const internalUrl = notifyUrl.replace(/\/api\/notifications$/, '/api/notifications/internal');
    return axios.post(internalUrl, payload).catch(err =>
        console.warn(`[Notify] Failed to send "${payload.title}" to user ${payload.userId}: ${err.message}`)
    );
};

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

        const resolvedPatientId =
            req.user.role === 'Patient' ? req.user.id : patientId;

        if (!resolvedPatientId) {
            return res.status(400).json({ message: 'patientId is required' });
        }
        if (!doctorId || !appointmentDate || !appointmentTime || !reason) {
            return res.status(400).json({ message: 'doctorId, appointmentDate, appointmentTime, and reason are required' });
        }

        // ─── Save appointment immediately — don't block on service calls ──
        const appointment = await Appointment.create({
            patientId: resolvedPatientId,
            doctorId,
            appointmentDate,
            appointmentTime,
            reason,
            notes: notes || null,
            type: type || 'clinic',
            createdBy: req.user.id,
            isAdminApproved: ['Admin', 'Receptionist', 'Doctor'].includes(req.user.role),
            attachmentUrl: req.file ? `uploads/${req.file.filename}` : null,
            patientName: null,  // enriched async below
            doctorName: null,
        });

        // ─── Respond immediately so the client isn't waiting ──────────────
        res.status(201).json({ message: 'Appointment created successfully', appointment });

        // ─── Background: enrich names + send notifications (non-blocking) ─
        const authHeader = { headers: { Authorization: req.headers.authorization } };
        const doctorUrl  = process.env.DOCTOR_SERVICE_URL;
        const patientUrl = process.env.PATIENT_SERVICE_URL;
        const authUrl    = process.env.AUTH_SERVICE_URL;
        const notifyUrl  = process.env.NOTIFICATION_SERVICE_URL;

        // Use a short timeout for background calls — don't hang forever
        const bgAxios = axios.create({ timeout: 15000 });

        (async () => {
            try {
                // Resolve names
                const [docRes, patRes] = await Promise.all([
                    bgAxios.get(`${doctorUrl}/${doctorId}`, authHeader).catch(() => ({ data: {} })),
                    bgAxios.get(`${patientUrl}/${resolvedPatientId}`, authHeader).catch(() => ({ data: {} }))
                ]);

                let resolvedDoctorName = docRes.data.fullName || null;
                let resolvedPatientName = patRes.data.fullName || null;

                if (!resolvedPatientName && req.user.role === 'Patient') {
                    try {
                        const meRes = await bgAxios.get(`${authUrl}/me`, authHeader);
                        resolvedPatientName = meRes.data?.fullName || null;
                    } catch { /* ignore */ }
                }

                if (!resolvedPatientName) {
                    try {
                        const usersRes = await bgAxios.get(`${authUrl}`, authHeader);
                        const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
                        const found = allUsers.find(u => String(u.id) === String(resolvedPatientId));
                        resolvedPatientName = found?.fullName || null;
                    } catch { /* ignore */ }
                }

                // Update appointment with resolved names
                if (resolvedDoctorName || resolvedPatientName) {
                    await appointment.update({
                        doctorName: resolvedDoctorName,
                        patientName: resolvedPatientName,
                    }).catch(() => {});
                }

                // Send notifications
                if (notifyUrl) {
                    const patientName = resolvedPatientName || `Patient #${resolvedPatientId.slice(-6).toUpperCase()}`;
                    const doctorName  = resolvedDoctorName  || 'Doctor';
                    const isVideo     = (type || 'clinic') === 'video';
                    const typeLabel   = isVideo ? 'Video Consultation' : 'Clinic Appointment';

                    await notify(notifyUrl, {
                        userId: resolvedPatientId,
                        title: `${typeLabel} Booked`,
                        message: `Your ${typeLabel.toLowerCase()} with Dr. ${doctorName} is scheduled for ${appointmentDate} at ${appointmentTime.slice(0,5)}.`,
                        type: 'Success',
                        link: '/appointments'
                    });
                    await notify(notifyUrl, {
                        userId: doctorId,
                        title: `New ${typeLabel}`,
                        message: `${patientName} has booked a ${typeLabel.toLowerCase()} for ${appointmentDate} at ${appointmentTime.slice(0,5)}.`,
                        type: 'Info',
                        link: '/appointments'
                    });

                    try {
                        const usersRes = await bgAxios.get(`${authUrl}`, authHeader);
                        const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
                        await Promise.all(
                            allUsers
                                .filter(u => u.role === 'Admin' || u.role === 'Receptionist')
                                .map(staff => notify(notifyUrl, {
                                    userId: staff.id,
                                    title: `📋 New ${typeLabel} Request`,
                                    message: `${patientName} has requested a ${typeLabel.toLowerCase()} with Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime.slice(0,5)}.`,
                                    type: 'Warning',
                                    link: '/appointments'
                                }))
                        );
                    } catch { /* non-fatal */ }
                }
            } catch (bgErr) {
                console.error('[Background] Appointment enrichment failed:', bgErr.message);
            }
        })();

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
        const authUrl = process.env.AUTH_SERVICE_URL;

        const patientsRes = await axios.get(patientUrl, authHeader).catch(() => ({ data: { patients: [] } }));
        const patientsList = patientsRes.data.patients || [];

        // Fallback: fetch auth users to resolve names for patients without profiles
        let authUsersList = [];
        try {
            const authRes = await axios.get(`${authUrl}`, authHeader);
            authUsersList = Array.isArray(authRes.data) ? authRes.data : [];
        } catch { /* ignore */ }

        // Also fetch doctor names for Admin/Receptionist
        let doctorsList = [];
        try {
            const doctorUrl = process.env.DOCTOR_SERVICE_URL;
            const docRes = await axios.get(`${doctorUrl}/public`, { params: { search: '' } }).catch(() => ({ data: { doctors: [] } }));
            doctorsList = docRes.data.doctors || docRes.data.records || [];
        } catch { /* use empty list */ }

        const enriched = appointments.map(apt => {
            // Use stored names first (set at creation time)
            if (apt.patientName && apt.doctorName) {
                return {
                    ...apt.toJSON(),
                    patientDetails: apt.patientName ? { fullName: apt.patientName } : null
                };
            }
            const patient = patientsList.find(p =>
                p.userId === apt.patientId || p.id === apt.patientId ||
                String(p.userId) === String(apt.patientId) || String(p.id) === String(apt.patientId)
            );
            const authUser = !patient ? authUsersList.find(u => String(u.id) === String(apt.patientId)) : null;
            const doctor = doctorsList.find(d =>
                d.userId === apt.doctorId || d.id === apt.doctorId ||
                String(d.userId) === String(apt.doctorId) || String(d.id) === String(apt.doctorId)
            );
            const authDoctor = !doctor ? authUsersList.find(u => String(u.id) === String(apt.doctorId)) : null;
            return {
                ...apt.toJSON(),
                patientName: apt.patientName || patient?.fullName || authUser?.fullName || null,
                doctorName: apt.doctorName || doctor?.fullName || authDoctor?.fullName || null,
                patientDetails: patient || (authUser ? { userId: authUser.id, fullName: authUser.fullName, email: authUser.email } : null)
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
            const authUrl = process.env.AUTH_SERVICE_URL;

            const [patientsRes, doctorsRes] = await Promise.all([
                axios.get(patientUrl, authHeader).catch(() => ({ data: { patients: [] } })),
                axios.get(`${doctorUrl}/public`, { params: { search: '' } }).catch(() => ({ data: { doctors: [] } }))
            ]);
            const patientsList = patientsRes.data.patients || [];
            const doctorsList = doctorsRes.data.doctors || doctorsRes.data.records || [];

            // Fallback: auth users for patients without profiles
            let authUsersList = [];
            try {
                const authRes = await axios.get(`${authUrl}`, authHeader);
                authUsersList = Array.isArray(authRes.data) ? authRes.data : [];
            } catch { /* ignore */ }

            const enriched = appointments.map(apt => {
                const patient = patientsList.find(p =>
                    p.id === apt.patientId || p.userId === apt.patientId ||
                    String(p.id) === String(apt.patientId) || String(p.userId) === String(apt.patientId)
                );
                const authUser = !patient ? authUsersList.find(u => String(u.id) === String(apt.patientId)) : null;
                const doctor = doctorsList.find(d =>
                    d.userId === apt.doctorId || d.id === apt.doctorId ||
                    String(d.userId) === String(apt.doctorId) || String(d.id) === String(apt.doctorId)
                );
                const authDoctor = !doctor ? authUsersList.find(u => String(u.id) === String(apt.doctorId)) : null;
                return {
                    ...apt.toJSON(),
                    patientName: apt.patientName || patient?.fullName || authUser?.fullName || null,
                    doctorName: apt.doctorName || doctor?.fullName || authDoctor?.fullName || null,
                    patientDetails: patient || (authUser ? { userId: authUser.id, fullName: authUser.fullName, email: authUser.email } : null)
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

        // Track who confirmed and when
        if (status === 'Confirmed' && previousStatus !== 'Confirmed') {
            appointment.confirmedAt = new Date();
            appointment.confirmedBy = req.user.id;
            // Fetch confirmer's name from auth-service
            try {
                const authUrl = process.env.AUTH_SERVICE_URL;
                const authHeader = { headers: { Authorization: req.headers.authorization } };
                const meRes = await axios.get(`${authUrl}/me`, authHeader);
                appointment.confirmedByName = meRes.data?.fullName || null;
            } catch {
                appointment.confirmedByName = null;
            }
        }

        await appointment.save();

        // ─── TRIGGER NOTIFICATIONS ON STATUS CHANGE ───
        try {
            const notifyUrl = process.env.NOTIFICATION_SERVICE_URL;
            if (notifyUrl) {
                const isVideo = appointment.type === 'video';
                const storedDoctorName = appointment.doctorName || 'Doctor';
                const storedPatientName = appointment.patientName || `Patient #${appointment.patientId.slice(-6).toUpperCase()}`;

                if (status === 'Confirmed') {
                    const visitMsg = isVideo
                        ? `Your video consultation with Dr. ${storedDoctorName} on ${appointment.appointmentDate} at ${appointment.appointmentTime?.slice(0,5)} is confirmed. Click to join the video call.`
                        : `Your clinic appointment with Dr. ${storedDoctorName} on ${appointment.appointmentDate} at ${appointment.appointmentTime?.slice(0,5)} is confirmed. Please visit the clinic.`;
                    await notify(notifyUrl, {
                        userId: appointment.patientId,
                        title: isVideo ? '📹 Video Consultation Confirmed' : '🏥 Clinic Appointment Confirmed',
                        message: visitMsg,
                        type: 'Success',
                        link: isVideo ? `/video/${appointment.id}` : '/appointments'
                    });
                    await notify(notifyUrl, {
                        userId: appointment.doctorId,
                        title: 'Appointment Confirmed',
                        message: `${storedPatientName}'s ${isVideo ? 'video consultation' : 'clinic appointment'} on ${appointment.appointmentDate} at ${appointment.appointmentTime?.slice(0,5)} has been confirmed.`,
                        type: 'Info',
                        link: '/appointments'
                    });
                }

                if (status === 'In Progress') {
                    await notify(notifyUrl, {
                        userId: appointment.patientId,
                        title: isVideo ? '📹 Doctor Has Joined the Call' : '🏥 Your Consultation Has Started',
                        message: isVideo
                            ? `Dr. ${storedDoctorName} has joined the video call. Click to join now.`
                            : `Dr. ${storedDoctorName} is ready for your consultation. Please proceed to the clinic.`,
                        type: 'Info',
                        link: isVideo ? `/video/${appointment.id}` : '/appointments'
                    });
                }

                if (status === 'Cancelled') {
                    await notify(notifyUrl, {
                        userId: appointment.patientId,
                        title: 'Appointment Cancelled',
                        message: `Your ${isVideo ? 'video consultation' : 'appointment'} on ${appointment.appointmentDate} at ${appointment.appointmentTime?.slice(0,5)} has been cancelled.`,
                        type: 'Error',
                        link: '/appointments'
                    });
                    await notify(notifyUrl, {
                        userId: appointment.doctorId,
                        title: 'Appointment Cancelled',
                        message: `${storedPatientName}'s appointment on ${appointment.appointmentDate} at ${appointment.appointmentTime?.slice(0,5)} has been cancelled.`,
                        type: 'Warning',
                        link: '/appointments'
                    });
                }

                if (status === 'Completed') {
                    await notify(notifyUrl, {
                        userId: appointment.patientId,
                        title: 'Consultation Completed ✓',
                        message: `Your ${isVideo ? 'video consultation' : 'appointment'} with Dr. ${storedDoctorName} has been completed. An invoice has been generated.`,
                        type: 'Success',
                        link: '/billing'
                    });
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

                // Fetch doctor's actual consultation fee (use videoFee for video appointments)
                let consultationFee = 150.00;
                try {
                    const docRes = await axios.get(`${doctorUrl}/${appointment.doctorId}`, authHeader);
                    const doc = docRes.data;
                    if (appointment.type === 'video' && doc.videoFee) {
                        consultationFee = parseFloat(doc.videoFee) || 150.00;
                    } else {
                        consultationFee = parseFloat(doc.consultationFee) || 150.00;
                    }
                } catch { /* use default */ }

                // Duplicate guard — check if an invoice already exists for this appointment
                const checkRes = await axios.get(billingUrl, {
                    ...authHeader,
                    params: { appointmentId: appointment.id }
                }).catch(() => ({ data: [] }));
                const existing = Array.isArray(checkRes.data) ? checkRes.data : [];
                if (existing.some(inv => inv.appointmentId === appointment.id)) {
                    console.log(`Invoice already exists for appointment ${appointment.id} — skipping auto-invoice`);
                } else {
                    const typeLabel = appointment.type === 'video' ? 'Video Consultation' : 'Clinic Consultation';
                    await axios.post(billingUrl, {
                        appointmentId: appointment.id,
                        patientId: appointment.patientId,
                        doctorId: appointment.doctorId,
                        amount: consultationFee,
                        description: `${typeLabel} - ${appointment.reason || 'Routine Checkup'}`,
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }, authHeader);
                    console.log(`Auto-invoice generated for completed appointment ${appointment.id} — ETB ${consultationFee}`);
                }
            } catch (err) {
                console.error('Failed to generate auto-invoice:', err.message);
            }
        }cription: `Clinical Consultation - ${appointment.reason || 'Routine Checkup'}`,
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
            const notifyUrl = process.env.NOTIFICATION_SERVICE_URL;
            if (notifyUrl) {
                const isVideo = appointment.type === 'video';
                const storedDoctorName = appointment.doctorName || 'Doctor';
                const storedPatientName = appointment.patientName || `Patient #${appointment.patientId.slice(-6).toUpperCase()}`;

                const visitMsg = isVideo
                    ? `Your video consultation with Dr. ${storedDoctorName} on ${appointment.appointmentDate} at ${appointment.appointmentTime?.slice(0,5)} has been approved. Click to join the video call when ready.`
                    : `Your clinic appointment with Dr. ${storedDoctorName} on ${appointment.appointmentDate} at ${appointment.appointmentTime?.slice(0,5)} has been approved. Please visit the clinic.`;
                await notify(notifyUrl, {
                    userId: appointment.patientId,
                    title: 'Appointment Approved ✓',
                    message: visitMsg,
                    type: 'Success',
                    link: isVideo ? `/video/${appointment.id}` : '/appointments'
                });
                await notify(notifyUrl, {
                    userId: appointment.doctorId,
                    title: 'New Patient Approved',
                    message: `${storedPatientName}'s ${isVideo ? 'video consultation' : 'clinic appointment'} on ${appointment.appointmentDate} at ${appointment.appointmentTime?.slice(0,5)} has been approved and is now in your schedule.`,
                    type: 'Info',
                    link: '/appointments'
                });
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
