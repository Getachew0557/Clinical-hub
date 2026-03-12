const axios = require('axios');

const GATEWAY = 'http://localhost:5050/api';

// Add request logger
axios.interceptors.request.use(config => {
    console.log(`[REQUEST] ${config.method.toUpperCase()} ${config.url}`);
    return config;
});

// Add response logger
axios.interceptors.response.use(
    response => {
        console.log(`[RESPONSE] ${response.status} ${response.config.url}`);
        return response;
    },
    error => {
        console.log(`[ERROR] ${error.response?.status || 'NETWORK'} ${error.config?.url}`);
        if (error.response?.data) {
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        }
        return Promise.reject(error);
    }
);

async function debugEMR() {
    try {
        console.log('--- STARTING EMR PATIENT DEBUG ---');

        // 1. Login
        console.log('\nStep 1: Authenticating as Patient (abebe@gmail.com)...');
        const loginRes = await axios.post(`${GATEWAY}/auth/login`, {
            email: 'abebe@gmail.com',
            password: 'password123'
        });

        const token = loginRes.data.token;
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };
        console.log('User Role:', loginRes.data.user.role);

        // 2. Get My Profile
        console.log('\nStep 2: Fetching "My Profile" from patient-service...');
        let profile;
        try {
            const profileRes = await axios.get(`${GATEWAY}/patients/my-profile`, authHeader);
            profile = profileRes.data;
            console.log('SUCCESS: Profile ID (PK):', profile.id, '| UserID (Link):', profile.userId);
        } catch (err) {
            console.error('FAIL: Could not fetch profile. This might be why the page shows "Failed to load your records".');
            return;
        }

        // 3. Fetch EMR Records
        console.log(`\nStep 3: Fetching EMR records for Profile ID: ${profile.id}...`);
        try {
            const emrRes = await axios.get(`${GATEWAY}/emr/patient/${profile.id}`, authHeader);
            console.log('SUCCESS: Records retrieved:', emrRes.data.count);
            if (emrRes.data.records.length > 0) {
                console.log('Sample Record PatientId:', emrRes.data.records[0].patientId);
            }
        } catch (err) {
            console.error('FAIL: Could not fetch EMR records.');
        }

    } catch (err) {
        console.error('\nFATAL DEBUG ERROR:', err.message);
    }
}

debugEMR();
