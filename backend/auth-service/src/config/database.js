/**
 * Supabase PostgreSQL connection
 * Set DATABASE_URL in Render env:
 * postgresql://postgres:Abc@12212729@db.tbiowvujbypfwzfwgehm.supabase.co:5432/postgres
 */
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

// No-op for Supabase — database always exists
export const ensureDatabaseExists = async () => {
    console.log('[DB] Supabase PostgreSQL — skipping database creation.');
};

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
    },
    pool: { max: 3, min: 0, acquire: 30000, idle: 10000 }
});

export default sequelize;
