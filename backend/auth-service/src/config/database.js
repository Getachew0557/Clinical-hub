/**
 * Supabase PostgreSQL connection
 * Uses DATABASE_URL from environment (set in Render / .env)
 * 
 * For Render: postgresql://postgres:Abc%4012212729@db.tbiowvujbypfwzfwgehm.supabase.co:5432/postgres
 */
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('[DB] ❌ DATABASE_URL is not set! Check your environment variables.');
    process.exit(1);
}

console.log('[DB] Connecting to Supabase PostgreSQL...');

// No-op for Supabase — database always exists
export const ensureDatabaseExists = async () => {
    console.log('[DB] Supabase PostgreSQL — skipping database creation.');
};

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    pool: {
        max: 3,
        min: 0,
        acquire: 60000,
        idle: 10000
    }
});

export default sequelize;
