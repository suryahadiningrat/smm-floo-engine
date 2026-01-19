require('dotenv').config();
const axios = require('axios');

const BLOG_ID = '3411718';
const USER_ID = '1996313';
const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;
const BASE_URL = 'https://app.metricool.com/api/v2';

async function probeCompetitorsRange() {
    console.log(`\n--- Probing 'analytics/competitors/instagram' (Range) ---`);
    const endpoint = `${BASE_URL}/analytics/competitors/instagram`;
    const params = {
        blogId: BLOG_ID,
        userId: USER_ID,
        from: '2024-10-01T00:00:00',
        to: '2024-10-15T23:59:59',
        format: 'json'
    };

    try {
        const response = await axios.get(endpoint, {
            params,
            headers: { 'X-Mc-Auth': USER_TOKEN }
        });
        
        const data = response.data;
        if (data.data && Array.isArray(data.data)) {
             console.log(`Success! Found ${data.data.length} competitors.`);
             
             // Find my account
             const myAccount = data.data.find(c => c.screenName === 'fdrtire' || c.username === 'fdrtire');
             if (myAccount) {
                 console.log('My Account Found:', myAccount.screenName);
                 console.log('Keys:', Object.keys(myAccount));
                 
                 // Check if there are nested values/history
                 if (myAccount.values) {
                     console.log('Found "values" array!');
                     console.log(JSON.stringify(myAccount.values.slice(0, 5), null, 2));
                 } else {
                     console.log('No "values" array. content:', JSON.stringify(myAccount, null, 2));
                 }
             } else {
                 console.log('My account not found in list.');
                 console.log('Competitors:', data.data.map(c => c.screenName));
             }
        }

    } catch (e) {
        console.error(`Failed: ${e.message}`);
    }
}

probeCompetitorsRange();
