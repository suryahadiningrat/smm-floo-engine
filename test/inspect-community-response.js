
require('dotenv').config();
const { fetchCompetitors } = require('../services/metricoolService');

const run = async () => {
    const BLOG_ID = process.env.METRICOOL_BLOG_ID;
    const USER_ID = process.env.METRICOOL_USER_ID;
    const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;

    if (!BLOG_ID || !USER_TOKEN) {
        console.error('Missing .env variables');
        return;
    }

    console.log('Fetching competitors stats for last 7 days...');
    // Fetch last 7 days
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    const from = lastWeek.toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];

    try {
        const data = await fetchCompetitors('instagram', from, to, BLOG_ID, USER_ID, USER_TOKEN);
        const myAccount = data.find(c => c.screenName === 'fdrtire' || c.username === 'fdrtire');
        console.log('My Account Data:', JSON.stringify(myAccount, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
};

run();
