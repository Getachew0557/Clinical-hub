/**
 * Supabase PostgreSQL connection
 * 
 * IMPORTANT: If your password contains @ symbol, it must be URL-encoded as %40
 * Example: Abc@12212729 → Abc%4012212729
 * 
 * DATABASE_URL for Render:
 * postgresql://postgres:Abc%4012212729@db.tbiowvujbypfwzfwgehm.supabase.co:5432/postgres
 */
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('[DB] ❌ DATABASE_URL is not set! Check your environment variables.');
    process.exit(1);
}

// Auto-fix: if password contains literal @ (not encoded), fix it
// Pattern: postgresql://user:pass@host → if pass contains @, encode it
// This handles the case where Render stores the raw value
if (DATABASE_URL.includes('Abc@12212729')) {
    DATABASE_URL = DATABASE_URL.replace('Abc@12212729', 'Abc%4012212729');
    console.log('[DB] Auto-fixed @ encoding in DATABASE_URL password');
}

console.log('[DB] Connecting to Supabase PostgreSQL...');
console.log('[DB] Host:', DATABASE_URL.split('@').pop()?.split('/')[0] || 'unknown');

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
