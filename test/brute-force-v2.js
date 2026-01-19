require('dotenv').config();
const axios = require('axios');

const BLOG_ID = '3411718';
const USER_ID = '1996313';
const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;
const BASE_URL_V2 = 'https://app.metricool.com/api/v2';
const BASE_URL_V1 = 'https://app.metricool.com/api';

const combos = [
    { base: BASE_URL_V2, path: 'analytics/instagram', params: {} },
    { base: BASE_URL_V2, path: `analytics/blog/${BLOG_ID}/community/instagram`, params: {} },
    { base: BASE_URL_V2, path: `analytics/blog/${BLOG_ID}/instagram/community`, params: {} },
    { base: BASE_URL_V1, path: 'analytics/community/instagram', params: {} },
    { base: BASE_URL_V1, path: 'analytics/instagram/community', params: {} },
    // Try without analytics prefix?
    { base: BASE_URL_V2, path: 'community/instagram', params: {} },
];

async function probe() {
    console.log('--- Brute Forcing Endpoints V2 ---');
    
    for (const combo of combos) {
        const endpoint = `${combo.base}/${combo.path}`;
        const params = {
            blogId: BLOG_ID,
            userId: USER_ID,
            from: '2024-10-01T00:00:00',
            to: '2024-10-15T23:59:59',
            format: 'json',
            ...combo.params
        };
        
        console.log(`\nTrying: ${endpoint}`);
        
        try {
            const response = await axios.get(endpoint, {
                params,
                headers: { 'X-Mc-Auth': USER_TOKEN }
            });
            console.log(`SUCCESS! Status: ${response.status}`);
            console.log('Keys:', Object.keys(response.data));

        } catch (e) {
            console.log(`Failed: ${e.response ? e.response.status : e.message}`);
        }
    }
}

probe();
