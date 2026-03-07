import { Sequelize } from 'sequelize';
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

        // Authorization check: If Patient role, they can only see their own
        if (req.user.role === 'Patient' && req.user.id !== patientId) {
            return res.status(403).json({ message: 'Not authorized to view these records' });
        }

        const records = await MedicalRecord.findAll({
            where: { patientId },
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

        // Authorization: Check if requester is Admin, the Doctor who wrote it, or the Patient
        const isStaff = ['Admin', 'Doctor'].includes(req.user.role);
        const isOwner = req.user.id === record.patientId;

        if (!isStaff && !isOwner) {
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

        if (req.user.role !== 'Admin' && req.user.id !== record.doctorId) {
            return res.status(403).json({ message: 'Not authorized to update this record' });
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
