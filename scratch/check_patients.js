const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', 'patient-service', '.env') });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

const PatientProfile = sequelize.define('PatientProfile', {
    id: { type: DataTypes.UUID, primaryKey: true },
    userId: { type: DataTypes.UUID },
    fullName: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING }
}, { tableName: 'PatientProfiles' });

async function check() {
    try {
        await sequelize.authenticate();
        const patients = await PatientProfile.findAll();
        console.log('--- PATIENT PROFILES ---');
        patients.forEach(p => {
            console.log(`ID: ${p.id}, UserID: ${p.userId}, Name: ${p.fullName}, Email: ${p.email}`);
        });
        await sequelize.close();
    } catch (e) {
        console.error(e);
    }
}

check();
