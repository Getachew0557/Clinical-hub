import sequelize from './src/config/database.js';
import User from './src/models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const checkAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const adminEmail = 'admin@ras.dental';
        const user = await User.findOne({ where: { email: adminEmail } });

        if (user) {
            console.log('Admin user found:', user.email);
            console.log('Role:', user.role);
            const isMatch = await bcrypt.compare('adminPassword123', user.password);
            console.log('Password match (adminPassword123):', isMatch);
        } else {
            console.log('Admin user NOT found.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAdmin();
