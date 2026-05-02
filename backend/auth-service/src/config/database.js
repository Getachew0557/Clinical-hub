/**
 * Supabase PostgreSQL — Session Pooler (IPv4, EU-West Ireland)
 * ✅ Tested and working: aws-0-eu-west-1.pooler.supabase.com:5432
 * 
 * DATABASE_URL in Render:
 * postgresql://postgres.kszqrnohleqhzwxhapym:6yciitJpy43VrfS2@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
 */
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('[DB] ❌ DATABASE_URL is not set!');
    process.exit(1);
}

// Auto-fix: if using old direct connection (IPv6-only), switch to pooler
if (DATABASE_URL.includes('.supabase.co:5432') && !DATABASE_URL.includes('pooler')) {
    const match = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@/);
    if (match) {
        const pass = match[2];
        DATABASE_URL = `postgresql://postgres.kszqrnohleqhzwxhapym:${pass}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`;
        console.log('[DB] Auto-switched to IPv4 session pooler (EU-West)');
    }
}

console.log('[DB] Connecting to Supabase (EU-West pooler)...');

export const ensureDatabaseExists = async () => {
    console.log('[DB] Supabase — skipping DB creation.');
};

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    pool: { max: 3, min: 0, acquire: 60000, idle: 10000 }
});

export default sequelize;
