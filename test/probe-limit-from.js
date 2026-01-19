
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const url = `https://app.metricool.com/api/v2/inbox/post-comments`;

    // Test Limit Cap
    console.log('Testing Limit 500...');
    try {
        const response = await axios.get(url, {
            params: { blogId, userId, provider: 'instagram', limit: 500 },
            headers: { 'X-Mc-Auth': userToken }
        });
        console.log(`Returned items: ${response.data.data.length}`);
    } catch (e) { console.error(e.message); }

    // Test 'from' with Date
    const date = '2025-01-01T00:00:00';
    console.log(`Testing from=${date}...`);
    try {
        const response = await axios.get(url, {
            params: { blogId, userId, provider: 'instagram', limit: 1, from: date },
            headers: { 'X-Mc-Auth': userToken }
        });
        console.log(`Result Date: ${response.data.data[0].creationDate}`);
    } catch (e) { console.error(e.message); }
};

run();
