import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('[DB] DATABASE_URL not set!'); process.exit(1); }

export const ensureDatabaseExists = async () => {
    console.log('[DB] Supabase PostgreSQL — skipping database creation.');
};

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    pool: { max: 3, min: 0, acquire: 60000, idle: 10000 }
});

export default sequelize;
