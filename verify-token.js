    const axios = require('axios');
require('dotenv').config();

const TOKEN = process.env.METRICOOL_USER_TOKEN;
const BLOG_ID = process.env.METRICOOL_BLOG_ID;
const USER_ID = process.env.METRICOOL_USER_ID;

console.log('--- Token Verification ---');
console.log(`Token length: ${TOKEN ? TOKEN.length : 0}`);
console.log(`Token preview: ${TOKEN ? TOKEN.substring(0, 20) + '...' : 'None'}`);

async function verifyToken() {
    try {
        // Try a simple endpoint: Competitors (lightweight) or just list blogs if possible, 
        // but since we have blogID, let's try a simple analytics call for today.
        const today = new Date().toISOString().split('T')[0];
        const url = `https://app.metricool.com/api/v2/analytics/posts/instagram`;
        
        console.log(`Testing request to: ${url}`);
        
        const response = await axios.get(url, {
            params: {
                blogId: BLOG_ID,
                userId: USER_ID,
                from: today + 'T00:00:00',
                to: today + 'T23:59:59'
            },
            headers: {
                'X-Mc-Auth': TOKEN,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Token is VALID!');
        console.log(`Response Status: ${response.status}`);
        console.log('Data received successfully.');
    } catch (error) {
        console.log('❌ Token is INVALID or Expired.');
        console.log(`Status: ${error.response ? error.response.status : 'Unknown'}`);
        console.log(`Message: ${error.message}`);
        if (error.response && error.response.data) {
            console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

verifyToken();
