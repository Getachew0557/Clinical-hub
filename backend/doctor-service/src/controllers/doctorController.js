import DoctorProfile from '../models/DoctorProfile.js';
import { Op } from 'sequelize';

// ─── CREATE PROFILE ────────────────────────────────────────────────────────

/**
 * POST /api/doctors
 * Admin creates a doctor profile and links it to a User in auth-service.
 * Required: userId, fullName, email, specialization, licenseNumber
 */
export const createDoctorProfile = async (req, res) => {
    try {
        const {
            userId, fullName, email, phone,
            specialization, licenseNumber,
            experience, qualification, bio,
            workingDays, workingHoursStart, workingHoursEnd,
            consultationFee, clinicFee, videoFee,
            serviceTypes, slotDuration, maxPatientsPerHour,
            breakStart, breakEnd,
            languages, education, workExperience, awards
        } = req.body;

        // Required fields validation
        if (!userId || !fullName || !email || !specialization || !licenseNumber) {
            return res.status(400).json({
                message: 'userId, fullName, email, specialization, and licenseNumber are required'
            });
        }

        // Duplicate checks
        const existingUser = await DoctorProfile.findOne({ where: { userId } });
        const existingEmail = await DoctorProfile.findOne({ where: { email } });
        const existingLicense = await DoctorProfile.findOne({ where: { licenseNumber } });

        if (existingUser) return res.status(409).json({ message: 'A profile for this user already exists' });
        if (existingEmail) return res.status(409).json({ message: 'A doctor with this email already exists' });
        if (existingLicense) return res.status(409).json({ message: 'A doctor with this license number already exists' });

        const profilePhoto = req.file ? `uploads/${req.file.filename}` : null;

        // Parse JSON fields if sent as strings
        const parseJSON = (val) => {
            if (!val) return undefined;
            if (typeof val === 'string') { try { return JSON.parse(val); } catch { return val; } }
            return val;
        };

        const doctor = await DoctorProfile.create({
            userId, fullName, email, phone,
            specialization, licenseNumber,
            experience, qualification, bio,
            workingDays: parseJSON(workingDays),
            workingHoursStart, workingHoursEnd,
            consultationFee, clinicFee, videoFee,
            serviceTypes: parseJSON(serviceTypes) || ['clinic', 'video'],
            slotDuration: slotDuration || 30,
            maxPatientsPerHour: maxPatientsPerHour || 10,
            breakStart, breakEnd,
            languages: parseJSON(languages),
            education: parseJSON(education),
            workExperience: parseJSON(workExperience),
            awards: parseJSON(awards),
            profilePhoto
        });

        res.status(201).json({ message: 'Doctor profile created successfully', doctor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── GET PUBLIC (unauthenticated, landing page) ────────────────────────────

/**
 * GET /api/doctors/public
 * No auth required. Returns active doctors only.
 * Supports: ?search=<name or specialty>  ?specialty=<exact match>
 */
export const getPublicDoctors = async (req, res) => {
    try {
        const { search, specialty } = req.query;
        const where = { isActive: true };

        if (search) {
            where[Op.or] = [
                { fullName: { [Op.like]: `%${search}%` } },
                { specialization: { [Op.like]: `%${search}%` } }
            ];
        }

        if (specialty && specialty.trim() !== '') {
            where.specialization = specialty.trim();
        }

        const doctors = await DoctorProfile.findAll({
            where,
            order: [['fullName', 'ASC']],
            attributes: [
                'id', 'fullName', 'specialization', 'experience', 'qualification', 'bio',
                'profilePhoto', 'consultationFee', 'videoFee', 'rating', 'reviewsCount',
                'isActive', 'serviceTypes', 'workingDays', 'workingHoursStart', 'workingHoursEnd',
                'slotDuration', 'breakStart', 'breakEnd', 'maxPatientsPerHour', 'languages'
            ]
        });

        res.status(200).json({ count: doctors.length, doctors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── GET ALL ───────────────────────────────────────────────────────────────

/**
 * GET /api/doctors
 * Admin & Receptionist: see all profiles.
 * Supports: ?specialization=Orthodontics  ?isActive=true  ?search=<name>
 */
export const getAllDoctors = async (req, res) => {
    try {
        const { specialization, isActive, search } = req.query;
        const where = {};

        if (specialization) where.specialization = specialization;
        if (isActive !== undefined) where.isActive = isActive === 'true';
        if (search) {
            where[Op.or] = [
                { fullName: { [Op.like]: `%${search}%` } },
                { specialization: { [Op.like]: `%${search}%` } }
            ];
        }

        const doctors = await DoctorProfile.findAll({
            where,
            order: [['fullName', 'ASC']]
        });

        res.status(200).json({ count: doctors.length, doctors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── GET ONE BY ID ─────────────────────────────────────────────────────────

/**
 * GET /api/doctors/:id
 * Admin, Receptionist: any doctor.
 * Doctor: only their own profile (matched via userId).
 */
export const getDoctorById = async (req, res) => {
    try {
        const doctor = await DoctorProfile.findByPk(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        const { role, id: userId } = req.user;

        // Doctor can only view their own profile
        if (role === 'Doctor' && doctor.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to view this profile' });
        }

        res.status(200).json(doctor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── GET MY PROFILE (Doctor self) ──────────────────────────────────────────

/**
 * GET /api/doctors/my-profile
 * Doctor fetches their own profile using their auth-service userId.
 */
export const getMyProfile = async (req, res) => {
    try {
        const doctor = await DoctorProfile.findOne({ where: { userId: req.user.id } });
        if (!doctor) {
            return res.status(404).json({
                message: 'No profile found for your account. Contact an Admin to create one.'
            });
        }
        res.status(200).json(doctor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── UPDATE ────────────────────────────────────────────────────────────────

/**
 * PUT /api/doctors/:id
 * Admin: can update all fields.
 * Doctor: can only update their own non-critical fields (bio, phone, workingDays/Hours, consultationFee, profilePhoto).
 */
export const updateDoctorProfile = async (req, res) => {
    try {
        const doctor = await DoctorProfile.findByPk(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        const { role, id: userId } = req.user;

        if (role === 'Doctor') {
            // Doctors can only edit their own profile
            if (doctor.userId !== userId) {
                return res.status(403).json({ message: 'Not authorized to edit this profile' });
            }
            // Doctor-editable fields
            const {
                phone, bio,
                workingDays, workingHoursStart, workingHoursEnd,
                consultationFee, videoFee,
                serviceTypes, slotDuration,
                breakStart, breakEnd
            } = req.body;

            const parseJSON = (val) => {
                if (!val) return undefined;
                if (typeof val === 'string') { try { return JSON.parse(val); } catch { return val; } }
                return val;
            };

            if (phone !== undefined) doctor.phone = phone;
            if (bio !== undefined) doctor.bio = bio;
            if (workingDays !== undefined) doctor.workingDays = parseJSON(workingDays);
            if (workingHoursStart !== undefined) doctor.workingHoursStart = workingHoursStart;
            if (workingHoursEnd !== undefined) doctor.workingHoursEnd = workingHoursEnd;
            if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
            if (videoFee !== undefined) doctor.videoFee = videoFee;
            if (serviceTypes !== undefined) doctor.serviceTypes = parseJSON(serviceTypes);
            if (slotDuration !== undefined) doctor.slotDuration = slotDuration;
            if (breakStart !== undefined) doctor.breakStart = breakStart;
            if (breakEnd !== undefined) doctor.breakEnd = breakEnd;
            if (req.file) doctor.profilePhoto = `uploads/${req.file.filename}`;

        } else {
            // Admin — full update
            const {
                fullName, email, phone, specialization, licenseNumber,
                experience, qualification, bio,
                workingDays, workingHoursStart, workingHoursEnd,
                consultationFee, clinicFee, videoFee,
                serviceTypes, slotDuration, maxPatientsPerHour,
                breakStart, breakEnd,
                languages, education, workExperience, awards,
                isActive
            } = req.body;

            const parseJSON = (val) => {
                if (!val) return undefined;
                if (typeof val === 'string') { try { return JSON.parse(val); } catch { return val; } }
                return val;
            };

            if (fullName !== undefined) doctor.fullName = fullName;
            if (email !== undefined) doctor.email = email;
            if (phone !== undefined) doctor.phone = phone;
            if (specialization !== undefined) doctor.specialization = specialization;
            if (licenseNumber !== undefined) doctor.licenseNumber = licenseNumber;
            if (experience !== undefined) doctor.experience = experience;
            if (qualification !== undefined) doctor.qualification = qualification;
            if (bio !== undefined) doctor.bio = bio;
            if (workingDays !== undefined) doctor.workingDays = parseJSON(workingDays);
            if (workingHoursStart !== undefined) doctor.workingHoursStart = workingHoursStart;
            if (workingHoursEnd !== undefined) doctor.workingHoursEnd = workingHoursEnd;
            if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
            if (clinicFee !== undefined) doctor.clinicFee = clinicFee;
            if (videoFee !== undefined) doctor.videoFee = videoFee;
            if (serviceTypes !== undefined) doctor.serviceTypes = parseJSON(serviceTypes);
            if (slotDuration !== undefined) doctor.slotDuration = slotDuration;
            if (maxPatientsPerHour !== undefined) doctor.maxPatientsPerHour = maxPatientsPerHour;
            if (breakStart !== undefined) doctor.breakStart = breakStart;
            if (breakEnd !== undefined) doctor.breakEnd = breakEnd;
            if (languages !== undefined) doctor.languages = parseJSON(languages);
            if (education !== undefined) doctor.education = parseJSON(education);
            if (workExperience !== undefined) doctor.workExperience = parseJSON(workExperience);
            if (awards !== undefined) doctor.awards = parseJSON(awards);
            if (isActive !== undefined) doctor.isActive = isActive;
            if (req.file) doctor.profilePhoto = `uploads/${req.file.filename}`;
        }

        await doctor.save();
        res.status(200).json({ message: 'Doctor profile updated successfully', doctor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── TOGGLE ACTIVE STATUS ──────────────────────────────────────────────────

/**
 * PATCH /api/doctors/:id/status
 * Admin only — activate or deactivate a doctor.
 */
export const toggleDoctorStatus = async (req, res) => {
    try {
        const doctor = await DoctorProfile.findByPk(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ message: 'isActive must be a boolean (true or false)' });
        }

        doctor.isActive = isActive;
        await doctor.save();

        res.status(200).json({
            message: `Doctor ${isActive ? 'activated' : 'deactivated'} successfully`,
            doctor
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── DELETE ────────────────────────────────────────────────────────────────

/**
 * DELETE /api/doctors/:id
 * Admin only — permanently removes the doctor profile.
 */
export const deleteDoctorProfile = async (req, res) => {
    try {
        const doctor = await DoctorProfile.findByPk(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        await doctor.destroy();
        res.status(200).json({ message: 'Doctor profile deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
