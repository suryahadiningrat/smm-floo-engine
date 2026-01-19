require('dotenv').config();
const metricoolService = require('../services/metricoolService');

const BLOG_ID = '3411718';
const USER_ID = '1996313';
const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;
const USERNAME = 'fdrtire';

async function inspect() {
    console.log('--- Inspecting Competitors Range (Oct 1 - Oct 15, 2024) ---');
    
    try {
        const data = await metricoolService.fetchCompetitors(
            'instagram', 
            '2024-10-01', 
            '2024-10-15', 
            BLOG_ID, 
            USER_ID, 
            USER_TOKEN
        );
        
        console.log(`Fetched ${data.length} items.`);
        const myAccount = data.find(c => c.screenName === USERNAME || c.username === USERNAME);
        
        if (myAccount) {
            console.log('My Account Data Keys:', Object.keys(myAccount));
            // Check for values/history
            if (myAccount.values) {
                console.log('Found VALUES array!');
                console.log(JSON.stringify(myAccount.values, null, 2));
            } else {
                console.log('No values array. Content:', JSON.stringify(myAccount, null, 2));
            }
        } else {
            console.log('My account not found in this range response.');
            // Maybe it's returned as separate days?
            // Let's print the first few items to see structure
            if (data.length > 0) {
                console.log('First item sample:', JSON.stringify(data[0], null, 2));
            }
        }

    } catch (e) {
        console.error('Fetch Failed:', e.message);
    }
}

inspect();
