import axios from 'axios';

async function updateAdmin() {
    try {
        const res = await axios.post('http://localhost:5001/api/auth/seed-admin', {
            seedKey: 'clinical-hub-seed-2024'
        });
        console.log('Admin password updated successfully:', res.data);
    } catch (e) {
        console.error('Update failed:', e.response?.data || e.message);
    }
}

updateAdmin();
