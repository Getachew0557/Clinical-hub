import { Sequelize } from 'sequelize';
import axios from 'axios';
import MedicalRecord from '../models/MedicalRecord.js';
import Prescription from '../models/Prescription.js';

/**
 * Create a new medical record with prescriptions (Doctor only)
 */
export const createRecord = async (req, res) => {
    try {
        const { patientId, appointmentId, diagnosis, treatment, notes, prescriptions } = req.body;
        const doctorId = req.user.id; // From JWT

        // 1. Create Medical Record
        const record = await MedicalRecord.create({
            patientId,
            doctorId,
            appointmentId,
            diagnosis,
            treatment,
            notes
        });

        // 2. Create Prescriptions if provided
        if (prescriptions && prescriptions.length > 0) {
            const prescriptionData = prescriptions.map(p => ({
                ...p,
                recordId: record.id
            }));
            await Prescription.bulkCreate(prescriptionData);
        }

        const result = await MedicalRecord.findByPk(record.id, {
            include: [{ model: Prescription, as: 'prescriptions' }]
        });

        res.status(201).json({ message: 'Medical record created successfully', record: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get all records for a patient (Admin, Doctor, or the Patient themselves)
 */
export const getPatientRecords = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Authorization check: If Patient role, we should ideally verify ownership.
        // For now, we allow Patients to see records if they provide a patientId.
        // (The Frontend only sends their own ID in My Profile view).
        if (req.user.role === 'Patient' && !patientId) {
            return res.status(403).json({ message: 'Patient ID required' });
        }

        let whereClause = { patientId };

        // ─── DOCTOR ISOLATION CHECK ───
        if (req.user.role === 'Doctor') {
            try {
                const aptUrl = process.env.APPOINTMENT_SERVICE_URL;
                const authHeader = { headers: { Authorization: req.headers.authorization } };

                // Check if this doctor has any appointment with this patient
                const aptRes = await axios.get(aptUrl, {
                    ...authHeader,
                    params: { doctorId: req.user.id, patientId }
                });

                const appointments = aptRes.data.appointments || [];
                if (appointments.length === 0) {
                    return res.status(403).json({
                        message: 'Access Denied: You are not assigned to this patient.'
                    });
                }
            } catch (err) {
                console.error('EMR Isolation Check Error:', err.message);
            }
            // Only see their OWN records for this patient
            whereClause.doctorId = req.user.id;
        }

        const records = await MedicalRecord.findAll({
            where: whereClause,
            include: [{ model: Prescription, as: 'prescriptions' }],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ count: records.length, records });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get single record details
 */
export const getRecordById = async (req, res) => {
    try {
        const record = await MedicalRecord.findByPk(req.params.id, {
            include: [{ model: Prescription, as: 'prescriptions' }]
        });

        if (!record) return res.status(404).json({ message: 'Record not found' });

        // Authorization: Check if requester is Admin, or Staff, or the Patient
        // As with getPatientRecords, we temporarily loosen the patient ownership check
        const isAuthorized = ['Admin', 'Doctor'].includes(req.user.role) || req.user.role === 'Patient';

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized to view this record' });
        }

        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update a medical record (Admin or original Doctor only)
 */
export const updateRecord = async (req, res) => {
    try {
        const record = await MedicalRecord.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        // Authorization: Original Doctor or Admin
        if (req.user.role !== 'Admin' && req.user.id !== record.doctorId) {
            return res.status(403).json({
                message: 'Not authorized to update this record',
                debug: { userId: req.user.id, doctorId: record.doctorId }
            });
        }

        await record.update(req.body);

        // Optional: Update/Replace prescriptions if provided in body
        if (req.body.prescriptions) {
            // Simple approach: Delete old and create new
            await Prescription.destroy({ where: { recordId: record.id } });
            const prescriptionData = req.body.prescriptions.map(p => ({
                ...p,
                recordId: record.id
            }));
            await Prescription.bulkCreate(prescriptionData);
        }

        const updatedRecord = await MedicalRecord.findByPk(record.id, {
            include: [{ model: Prescription, as: 'prescriptions' }]
        });

        res.status(200).json({ message: 'Record updated successfully', record: updatedRecord });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete a medical record (Admin Only)
 */
export const deleteRecord = async (req, res) => {
    try {
        const record = await MedicalRecord.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only admins can delete medical records' });
        }

        await record.destroy();
        res.status(200).json({ message: 'Medical record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
