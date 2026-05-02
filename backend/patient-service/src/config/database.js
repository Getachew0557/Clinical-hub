import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config();

dns.setDefaultResultOrder('ipv4first');

let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('[DB] DATABASE_URL not set!'); process.exit(1); }
if (DATABASE_URL.includes('Abc@12212729')) DATABASE_URL = DATABASE_URL.replace('Abc@12212729', 'Abc%4012212729');

export const ensureDatabaseExists = async () => { console.log('[DB] Supabase — skipping DB creation.'); };

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres', logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    pool: { max: 3, min: 0, acquire: 60000, idle: 10000 }
});
export default sequelize;
