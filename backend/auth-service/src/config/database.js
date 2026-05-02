/**
 * Supabase PostgreSQL connection
 * Forces IPv4 to work on Render free tier (no IPv6 outbound)
 * 
 * DATABASE_URL in Render:
 * postgresql://postgres:Abc%4012212729@db.tbiowvujbypfwzfwgehm.supabase.co:5432/postgres
 */
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config();

// Force IPv4 DNS resolution — Render free tier doesn't support IPv6 outbound
dns.setDefaultResultOrder('ipv4first');

let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('[DB] ❌ DATABASE_URL is not set!');
    process.exit(1);
}

// Auto-fix unencoded @ in password
if (DATABASE_URL.includes('Abc@12212729')) {
    DATABASE_URL = DATABASE_URL.replace('Abc@12212729', 'Abc%4012212729');
    console.log('[DB] Auto-fixed @ encoding in password');
}

console.log('[DB] Connecting to Supabase (IPv4 forced)...');

export const ensureDatabaseExists = async () => {
    console.log('[DB] Supabase PostgreSQL — skipping database creation.');
};

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
    },
    pool: { max: 3, min: 0, acquire: 60000, idle: 10000 }
});

export default sequelize;
