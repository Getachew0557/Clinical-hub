const { Sequelize } = require('sequelize');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Load environment from auth-service
require('dotenv').config({ path: './backend/auth-service/.env' });

const JWT_SECRET = process.env.JWT_SECRET || '9bf0d8211778c3fd59351f8482db2a68c32cbebd1d1f91817cf4867255c93309';
const PATIENT_SERVICE_URL = 'http://localhost:5002/api/patients';

const generateInternalToken = () => {
    return jwt.sign({ id: 'SYSTEM_FIX', role: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });
};

async function fixMissingProfiles() {
    const authSequelize = new Sequelize('dental_auth_db', 'root', 'Abc@1221', { host: 'localhost', dialect: 'mysql', logging: false });
    const patientSequelize = new Sequelize('dental_patient_db', 'root', 'Abc@1221', { host: 'localhost', dialect: 'mysql', logging: false });

    try {
        console.log('--- RETROACTIVE PROFILE FIX ---');

        // 1. Get all Patients from Auth
        const [users] = await authSequelize.query("SELECT id, fullName, email FROM Users WHERE role = 'Patient'");
        console.log(`Found ${users.length} total patients in Auth system.`);

        const token = generateInternalToken();
        let fixedCount = 0;

        for (const user of users) {
            // 2. Check if profile exists
            const [profiles] = await patientSequelize.query(`SELECT id FROM PatientProfiles WHERE userId = '${user.id}'`);

            if (profiles.length === 0) {
                console.log(`Missing profile for: ${user.email} (${user.fullName}). Creating...`);
                try {
                    await axios.post(PATIENT_SERVICE_URL, {
                        userId: user.id,
                        fullName: user.fullName,
                        email: user.email
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    fixedCount++;
                } catch (err) {
                    console.error(`Failed to create for ${user.email}:`, err.response?.data || err.message);
                }
            }
        }

        console.log(`\nFix complete. Created ${fixedCount} missing profiles.`);

    } catch (err) {
        console.error('Fatal FIX error:', err.message);
    } finally {
        await authSequelize.close();
        await patientSequelize.close();
    }
}

fixMissingProfiles();
