import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const services = [
    { name: 'API Gateway', port: 5050, path: 'backend/api-gateway' },
    { name: 'Auth Service', port: 5001, path: 'backend/auth-service', db: 'dental_auth_db' },
    { name: 'Patient Service', port: 5002, path: 'backend/patient-service', db: 'dental_patient_db' },
    { name: 'Appointment Service', port: 5003, path: 'backend/appointment-service', db: 'dental_appointment_db' },
    { name: 'EMR Service', port: 5004, path: 'backend/emr-service', db: 'dental_emr_db' },
    { name: 'Billing Service', port: 5005, path: 'backend/billing-service', db: 'dental_billing_db' },
    { name: 'Inventory Service', port: 5006, path: 'backend/inventory-service', db: 'dental_inventory_db' },
    { name: 'Notification Service', port: 5008, path: 'backend/notification-service', db: 'dental_notification_db' },
    { name: 'AI Service', port: 5009, path: 'backend/ai-service' },
    { name: 'Doctor Service', port: 5010, path: 'backend/doctor-service', db: 'dental_doctor_db' },
    { name: 'Report Service', port: 5011, path: 'backend/report-service', db: 'dental_report_db' },
];

async function checkDatabase(service) {
    if (!service.db) return 'N/A';
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Abc@1221',
            database: service.db
        });
        await connection.end();
        return 'Connected ✅';
    } catch (err) {
        return `Failed ❌ (${err.code})`;
    }
}

async function runDiagnostic() {
    console.log('==========================================');
    console.log('   Clinical Hub: System Diagnostic');
    console.log('==========================================\n');

    const results = [];

    for (const s of services) {
        const dbStatus = await checkDatabase(s);
        results.push({
            Service: s.name,
            Port: s.port,
            Database: s.db || 'None',
            DB_Status: dbStatus
        });
    }

    console.table(results);
    console.log('\nAudit Complete.');
}

runDiagnostic();
