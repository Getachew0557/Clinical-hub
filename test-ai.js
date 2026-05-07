import axios from 'axios';

const API_URL = 'http://localhost:5005/api/ai'; // Adjust port if necessary

async function testAI() {
    console.log('--- Testing AI Service Backend ---');

    // 1. Test Public Chat
    try {
        console.log('\n[1] Testing /public-chat...');
        const res = await axios.post(`${API_URL}/public-chat`, {
            message: "What are your clinic hours?",
            history: []
        });
        console.log('Response:', res.data.response);
    } catch (err) {
        console.error('Public Chat Error:', err.response?.data || err.message);
    }

    // 2. Test Context Assistant (Requires Token - you can paste one here or test unauthenticated if allowed)
    // For local testing without auth middleware, you might need to temporarily disable 'protect' in aiRoutes.js
    console.log('\n[2] Testing /context-assistant (Simulated)...');
    console.log('Note: This usually requires a Doctor/Admin token.');
    
    try {
        const res = await axios.post(`${API_URL}/context-assistant`, {
            message: "How do I add a new patient?",
            pageName: "PatientListPage",
            userRole: "Doctor",
            history: []
        });
        console.log('Response:', res.data.response);
    } catch (err) {
        console.log('Context Assistant: Auth required (expected if no token provided)');
    }

    console.log('\n--- Testing Complete ---');
}

testAI();
