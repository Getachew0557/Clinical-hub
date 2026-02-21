import sequelize from './src/config/database.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Check if admin already exists
        const adminEmail = 'admin@ras.dental';
        const existingAdmin = await User.findOne({ where: { email: adminEmail } });

        if (existingAdmin) {
            console.log('Admin user already exists.');
        } else {
            await User.create({
                fullName: 'System Administrator',
                email: adminEmail,
                password: 'adminPassword123',
                role: 'Admin'
            });
            console.log('Admin user created successfully.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
