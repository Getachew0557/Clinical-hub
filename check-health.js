import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICES = [
    { name: 'Auth', port: 5001, path: '/api/health' },
    { name: 'Patient', port: 5002, path: '/api/health' },
    { name: 'Appointment', port: 5003, path: '/api/health' },
    { name: 'EMR', port: 5004, path: '/api/health' },
    { name: 'Billing', port: 5005, path: '/api/health' },
    { name: 'Inventory', port: 5006, path: '/api/health' },
    { name: 'Report', port: 5011, path: '/api/health' },
    { name: 'Doctor', port: 5010, path: '/api/health' },
    { name: 'Gateway', port: 5050, path: '/api/health' }
];

async function checkHealth() {
    console.log('=== Clinical Hub Service Health Check ===\n');

    for (const s of SERVICES) {
        try {
            const res = await axios.get(`http://localhost:${s.port}${s.path}`, { timeout: 2000 });
            console.log(`[PASS] ${s.name.padEnd(12)}: Online (Port ${s.port})`);
        } catch (err) {
            console.log(`[FAIL] ${s.name.padEnd(12)}: OFFLINE (Port ${s.port}) - ${err.code || err.message}`);
        }
    }
}

checkHealth();
