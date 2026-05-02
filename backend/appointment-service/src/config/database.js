import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('[DB] DATABASE_URL not set!'); process.exit(1); }

if (DATABASE_URL.includes('.supabase.co:5432') && !DATABASE_URL.includes('pooler')) {
    const match = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@/);
    if (match) {
        DATABASE_URL = `postgresql://postgres.kszqrnohleqhzwxhapym:${match[2]}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`;
        console.log('[DB] Auto-switched to IPv4 session pooler');
    }
}

export const ensureDatabaseExists = async () => { console.log('[DB] Supabase — skipping DB creation.'); };

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres', logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    pool: { max: 3, min: 0, acquire: 60000, idle: 10000 }
});
export default sequelize;
