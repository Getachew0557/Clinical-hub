import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const { DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT, DB_SSL } = process.env;

const sslConfig = DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {};

export const ensureDatabaseExists = async () => {
    if (DB_SSL === 'true') {
        console.log(`Using existing database "${DB_NAME}" (SSL mode).`);
        return;
    }
    try {
        const connection = await mysql.createConnection({
            host: DB_HOST,
            port: parseInt(DB_PORT) || 3306,
            user: DB_USER,
            password: DB_PASS,
            ...sslConfig
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
        await connection.end();
        console.log(`Database "${DB_NAME}" ensured.`);
    } catch (error) {
        console.error('Error ensuring database exists:', error);
        throw error;
    }
};

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: parseInt(DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: { ...sslConfig },
    pool: { max: 3, min: 0, acquire: 30000, idle: 10000 }
});

export default sequelize;
