const { Sequelize, DataTypes } = require('sequelize');

async function checkDB() {
    const authSequelize = new Sequelize('dental_auth_db', 'root', 'Abc@1221', { host: 'localhost', dialect: 'mysql', logging: false });
    const patientSequelize = new Sequelize('dental_patient_db', 'root', 'Abc@1221', { host: 'localhost', dialect: 'mysql', logging: false });
    const emrSequelize = new Sequelize('dental_emr_db', 'root', 'Abc@1221', { host: 'localhost', dialect: 'mysql', logging: false });

    try {
        console.log('--- DATABASE DIAGNOSTIC ---');

        // 1. Get User from Auth
        const email = 'abebe@gmail.com';
        const [users] = await authSequelize.query(`SELECT id, fullName, role FROM Users WHERE email = '${email}'`);
        if (users.length === 0) {
            console.log('User NOT found in Auth DB.');
            return;
        }
        const user = users[0];
        console.log('Auth User:', user.fullName, 'ID:', user.id, 'Role:', user.role);

        // 2. Get Patient Profile
        const [profiles] = await patientSequelize.query(`SELECT id, userId, fullName FROM PatientProfiles WHERE userId = '${user.id}'`);
        if (profiles.length === 0) {
            console.log('Profile NOT found in Patient DB for userId:', user.id);
        } else {
            const profile = profiles[0];
            console.log('Patient Profile Found! ID:', profile.id, 'userId:', profile.userId);

            // 3. Check EMR Records
            const [records] = await emrSequelize.query(`SELECT id, patientId, doctorId, diagnosis FROM MedicalRecords WHERE patientId = '${profile.id}'`);
            console.log('EMR Records Found for Profile ID:', records.length);

            const [recordsByUser] = await emrSequelize.query(`SELECT id, patientId, doctorId, diagnosis FROM MedicalRecords WHERE patientId = '${user.id}'`);
            console.log('EMR Records Found for User ID:', recordsByUser.length);
        }

    } catch (err) {
        console.error('Diagnostic error:', err.message);
    } finally {
        await authSequelize.close();
        await patientSequelize.close();
        await emrSequelize.close();
    }
}

checkDB();
