require('dotenv').config();
const axios = require('axios');

const BLOG_ID = '3411718';
const USER_ID = '1996313';
const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;
const BASE_URL = 'https://app.metricool.com/api/v2';

const combos = [
    { path: 'analytics/community/instagram', params: {} },
    { path: 'analytics/account/instagram', params: {} },
    { path: 'analytics/evolution/instagram', params: {} },
    { path: 'analytics/instagram/community', params: {} },
    { path: 'analytics/instagram/evolution', params: {} },
    { path: 'analytics/community', params: { platform: 'instagram' } },
    { path: 'analytics/community', params: { provider: 'instagram' } },
    // Try adding timezone
    { path: 'analytics/community/instagram', params: { timezone: 'Asia/Jakarta' } },
];

async function probe() {
    console.log('--- Brute Forcing Endpoints ---');
    
    for (const combo of combos) {
        const endpoint = `${BASE_URL}/${combo.path}`;
        const params = {
            blogId: BLOG_ID,
            userId: USER_ID,
            from: '2024-10-01T00:00:00',
            to: '2024-10-15T23:59:59',
            format: 'json',
            ...combo.params
        };
        
        console.log(`\nTrying: ${combo.path} with params keys: ${Object.keys(combo.params).join(',')}`);
        
        try {
            const response = await axios.get(endpoint, {
                params,
                headers: { 'X-Mc-Auth': USER_TOKEN }
            });
            console.log(`SUCCESS! Status: ${response.status}`);
            const data = response.data;
            if (data.data) console.log(`Data length: ${Array.isArray(data.data) ? data.data.length : 'Object'}`);
            else console.log('Data:', Object.keys(data));
            
            // If success, print sample
            // console.log(JSON.stringify(data, null, 2).substring(0, 500));
            
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                 const sample = data.data[0];
                 console.log('Sample:', JSON.stringify(sample, null, 2));
                 // Check for 76840
                 if (JSON.stringify(data).includes('76840')) console.log('!!! FOUND 76840 !!!');
            }

        } catch (e) {
            console.log(`Failed: ${e.response ? e.response.status : e.message}`);
        }
    }
}

probe();
