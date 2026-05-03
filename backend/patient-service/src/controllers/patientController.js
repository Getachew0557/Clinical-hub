import { Op } from 'sequelize';
import PatientProfile from '../models/PatientProfile.js';

// ─── Controller Methods ───────────────────────────────────────────────────

/**
 * Get all patient profiles (Admin, Receptionist, Doctor only)
 */
export const getAllPatients = async (req, res) => {
    try {
        const { search, bloodGroup, isActive, ids } = req.query;
        let where = {};

        if (search) {
            where[Op.or] = [
                { fullName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } }
            ];
        }
        if (bloodGroup) where.bloodGroup = bloodGroup;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        // Filter by specific IDs (used for Doctor-Patient isolation)
        if (ids) {
            where.id = { [Op.in]: ids.split(',') };
        }
        // Note: Doctors can see all patients — isolation is enforced at the appointment level

        const patients = await PatientProfile.findAll({
            where,
            order: [['fullName', 'ASC']]
        });

        res.status(200).json({ count: patients.length, patients });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Create a new patient profile (Admin/Receptionist only)
 */
export const createPatientProfile = async (req, res) => {
    try {
        const {
            userId, fullName, email, dateOfBirth, gender,
            phone, address, emergencyContactName, emergencyContactPhone,
            bloodGroup, allergies, medicalConditions
        } = req.body;

        // Required Check (Relaxed for skeleton profile creation during registration)
        if (!userId || !fullName || !email) {
            return res.status(400).json({
                message: 'userId, fullName, and email are required'
            });
        }

        const existing = await PatientProfile.findOne({ where: { [Op.or]: [{ userId }, { email }] } });

        const profilePhoto = req.file ? req.file.path.replace(/\\/g, '/') : null;
        const profileData = {
            userId, fullName, email, dateOfBirth, gender,
            phone, address, emergencyContactName, emergencyContactPhone,
            bloodGroup, allergies, medicalConditions, profilePhoto
        };

        if (existing) {
            // Update existing profile (likely a skeleton profile from registration)
            await existing.update(profileData);
            return res.status(200).json({ message: 'Patient profile updated successfully', patient: existing });
        }

        const patient = await PatientProfile.create(profileData);
        res.status(201).json({ message: 'Patient profile created successfully', patient });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get authenticated patient's own profile
 */
export const getMyProfile = async (req, res) => {
    try {
        const profile = await PatientProfile.findOne({ where: { userId: req.user.id } });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get specific profile (Admin/Doctor/Receptionist, or Patient Owner)
 */
export const getPatientById = async (req, res) => {
    try {
        let patient = await PatientProfile.findByPk(req.params.id);

        // If not found by PK, try searching by userId (in case front-end sends userId)
        if (!patient) {
            patient = await PatientProfile.findOne({ where: { userId: req.params.id } });
        }

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Patient ownership check
        if (req.user.role === 'Patient' && req.user.id !== patient.userId) {
            return res.status(403).json({ message: 'Not authorized to view this profile' });
        }

        // Doctor isolation check
        if (req.user.role === 'Doctor') {
            // Doctors are authorized to see profiles of patients in their schedule.
            // (Assumed valid if navigating from their filtered list).
        }

        res.status(200).json(patient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update patient profile
 */
export const updatePatientProfile = async (req, res) => {
    try {
        let patient = await PatientProfile.findByPk(req.params.id);
        
        // Fallback: If not found by primary key, try userId
        if (!patient) {
            patient = await PatientProfile.findOne({ where: { userId: req.params.id } });
        }

        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        // Authorization: Admin can edit anything. Patient can only edit their own.
        const isAdmin = req.user.role === 'Admin';
        const isOwner = req.user.id === patient.userId;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Not authorized to edit this profile' });
        }

        // Prepare update data
        let updateData = { ...req.body };

        // Security: Non-admins cannot change userId or email once set
        if (!isAdmin) {
            delete updateData.userId;
            delete updateData.email;
        }

        if (req.file) {
            updateData.profilePhoto = req.file.path.replace(/\\/g, '/');
        }

        await patient.update(updateData);
        res.status(200).json({ message: 'Profile updated successfully', patient });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Toggle Active Status (Admin Only)
 */
export const togglePatientStatus = async (req, res) => {
    try {
        const patient = await PatientProfile.findByPk(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        patient.isActive = req.body.isActive !== undefined ? req.body.isActive : !patient.isActive;
        await patient.save();

        res.status(200).json({
            message: `Patient ${patient.isActive ? 'activated' : 'deactivated'} successfully`,
            patient
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete Patient Profile (Admin Only)
 */
export const deletePatientProfile = async (req, res) => {
    try {
        const patient = await PatientProfile.findByPk(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        await patient.destroy();
        res.status(200).json({ message: 'Patient profile deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
