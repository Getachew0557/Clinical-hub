const { Sequelize } = require('sequelize');

async function checkHospitals() {
    const doctorSequelize = new Sequelize('dental_doctor_db', 'root', 'Abc@1221', { 
        host: 'localhost', 
        dialect: 'mysql', 
        logging: false 
    });

    try {
        console.log('--- HOSPITAL DATA CHECK ---');
        const [hospitals] = await doctorSequelize.query(`SELECT id, name, isActive FROM Hospitals`);
        console.log('Hospitals in DB:', hospitals);

        const [doctors] = await doctorSequelize.query(`SELECT id, fullName, hospitalId FROM Doctors`);
        console.log('Doctors in DB:', doctors);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await doctorSequelize.close();
    }
}

checkHospitals();
