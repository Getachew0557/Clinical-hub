/**
 * Remote seed script — runs against the deployed Render backend
 * Usage: node seed-remote.js
 */
import axios from 'axios';

const BASE_URL = 'https://clinical-hub.onrender.com/api';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASS = 'Abc@1221';

// Give Render time to wake up
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitForService() {
    console.log('Waiting for Render service to wake up...');
    for (let i = 0; i < 10; i++) {
        try {
            await axios.get(`${BASE_URL}/health`, { timeout: 10000 });
            console.log('Service is up!');
            return true;
        } catch {
            console.log(`Attempt ${i + 1}/10 - not ready yet, waiting 10s...`);
            await sleep(10000);
        }
    }
    throw new Error('Service did not wake up in time');
}

async function createAdmin() {
    // Try to register admin first
    try {
        await axios.post(`${BASE_URL}/auth/register`, {
            fullName: 'System Admin',
            email: ADMIN_EMAIL,
            password: ADMIN_PASS,
            role: 'Admin'
        }, { timeout: 30000 });
        console.log('Admin user created.');
    } catch (e) {
        if (e.response?.data?.message?.includes('already exists')) {
            console.log('Admin already exists.');
        } else {
            console.log('Admin creation note:', e.response?.data?.message || e.message);
        }
    }
}

async function seed() {
    console.log('=== REMOTE SEED STARTING ===');
    console.log(`Target: ${BASE_URL}`);

    await waitForService();
    await createAdmin();

    // Try login
    try {
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        }, { timeout: 30000 });
        console.log('✅ Login successful! Admin user is ready.');
        console.log('User:', loginRes.data.user);
    } catch (e) {
        console.error('❌ Login failed:', e.response?.data || e.message);
    }

    console.log('=== SEED COMPLETE ===');
}

seed();
