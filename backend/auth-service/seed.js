/**
 * Production seed script — creates Admin user if not exists.
 * Run: node seed.js
 */
import dotenv from 'dotenv';
dotenv.config();

import sequelize, { ensureDatabaseExists } from './src/config/database.js';
import User from './src/models/User.js';

const ADMIN = {
    fullName: 'Admin',
    email:    'admin@gmail.com',
    password: 'Abc@1221',
    role:     'Admin'
};

const seedAdmin = async () => {
    try {
        await ensureDatabaseExists();
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        await sequelize.sync({ alter: true });
        console.log('✅ Models synced.');

        const existing = await User.findOne({ where: { email: ADMIN.email } });

        if (existing) {
            console.log(`ℹ️  Admin already exists: ${ADMIN.email}`);
        } else {
            await User.create(ADMIN);
            console.log(`✅ Admin created: ${ADMIN.email} / ${ADMIN.password}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error.message);
        process.exit(1);
    }
};

seedAdmin();
