import { Sequelize } from 'sequelize';
import axios from 'axios';
import MedicalRecord from '../models/MedicalRecord.js';
import Prescription from '../models/Prescription.js';
import AuditLog from '../models/AuditLog.js';

// ─── Audit helper ──────────────────────────────────────────────────────────
const audit = (req, action, resource, resourceId, patientId, details = null) => {
    AuditLog.create({
        actorId: req.user?.id,
        actorRole: req.user?.role || 'Unknown',
        action,
        resource,
        resourceId: resourceId || null,
        patientId: patientId || null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
        details: details ? JSON.stringify(details) : null,
    }).catch(err => console.warn('[Audit] Failed to log:', err.message));
};

// Helper to send notifications
const sendNotification = async (req, userId, title, message, link, type = 'info') => {
    try {
        const notifyUrl = process.env.NOTIFICATION_SERVICE_URL;
        if (!notifyUrl) return;

        await axios.post(notifyUrl, {
            userId,
            title,
            message,
            type,
            link
        }, {
            headers: { Authorization: req.headers.authorization }
        });
    } catch (err) {
        console.error('Notification Trigger Error:', err.message);
    }
};

export const createRecord = async (req, res) => {
    try {
        const { patientId, appointmentId, diagnosis, treatment, notes, prescriptions } = req.body;
        const doctorId = req.user.id;
        const attachmentUrl = req.file ? req.file.path : null;

        const record = await MedicalRecord.create({
            patientId, doctorId, appointmentId, diagnosis, treatment, notes, attachmentUrl
        });

        if (prescriptions && prescriptions.length > 0) {
            const prescriptionData = prescriptions.map(p => ({ ...p, recordId: record.id }));
            await Prescription.bulkCreate(prescriptionData);
        }

        const result = await MedicalRecord.findByPk(record.id, {
            include: [{ model: Prescription, as: 'prescriptions' }]
        });

        // Trigger Notification
        sendNotification(req, patientId, 'Medical Record Updated', `A new health record has been added to your profile.`, '/emr', 'Info');

        // Audit log
        audit(req, 'CREATE', 'MedicalRecord', record.id, patientId, { diagnosis: record.diagnosis });

        res.status(201).json({ message: 'Medical record created successfully', record: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPatientRecords = async (req, res) => {
    try {
        const { patientId } = req.params;

        if (req.user.role === 'Patient' && !patientId) {
            return res.status(403).json({ message: 'Patient ID required' });
        }

        let whereClause = { patientId };

        if (req.user.role === 'Doctor') {
            try {
                const aptUrl = process.env.APPOINTMENT_SERVICE_URL;
                const authHeader = { headers: { Authorization: req.headers.authorization } };
                const aptRes = await axios.get(aptUrl, { ...authHeader, params: { doctorId: req.user.id, patientId } });
                const appointments = aptRes.data.appointments || [];
                if (appointments.length === 0) {
                    return res.status(403).json({ message: 'Access Denied: You are not assigned to this patient.' });
                }
            } catch (err) {
                console.error('EMR Isolation Check Error:', err.message);
            }
            whereClause.doctorId = req.user.id;
        }

        const records = await MedicalRecord.findAll({
            where: whereClause,
            include: [{ model: Prescription, as: 'prescriptions' }],
            order: [['createdAt', 'DESC']]
        });

        // Audit log — track who accessed patient records
        audit(req, 'READ', 'MedicalRecord', null, patientId, { count: records.length });

        res.status(200).json({ count: records.length, records });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRecordById = async (req, res) => {
    try {
        const record = await MedicalRecord.findByPk(req.params.id, {
            include: [{ model: Prescription, as: 'prescriptions' }]
        });

        if (!record) return res.status(404).json({ message: 'Record not found' });

        const isAuthorized = ['Admin', 'Doctor', 'Patient'].includes(req.user.role);
        if (!isAuthorized) return res.status(403).json({ message: 'Not authorized to view this record' });

        // Audit log
        audit(req, 'READ', 'MedicalRecord', record.id, record.patientId);

        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateRecord = async (req, res) => {
    try {
        const record = await MedicalRecord.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        if (req.user.role !== 'Admin' && req.user.id !== record.doctorId) {
            return res.status(403).json({ message: 'Not authorized to update this record' });
        }

        await record.update(req.body);

        if (req.body.prescriptions) {
            await Prescription.destroy({ where: { recordId: record.id } });
            const prescriptionData = req.body.prescriptions.map(p => ({ ...p, recordId: record.id }));
            await Prescription.bulkCreate(prescriptionData);
        }

        const updatedRecord = await MedicalRecord.findByPk(record.id, {
            include: [{ model: Prescription, as: 'prescriptions' }]
        });

        // Audit log
        audit(req, 'UPDATE', 'MedicalRecord', record.id, record.patientId);

        res.status(200).json({ message: 'Record updated successfully', record: updatedRecord });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteRecord = async (req, res) => {
    try {
        const record = await MedicalRecord.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only admins can delete medical records' });
        }

        await record.destroy();

        // Audit log
        audit(req, 'DELETE', 'MedicalRecord', req.params.id, record.patientId);

        res.status(200).json({ message: 'Medical record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
