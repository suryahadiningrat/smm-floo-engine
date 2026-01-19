
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const url = `https://app.metricool.com/api/v2/inbox/post-comments`;

    // 1. Fetch baseline (newest)
    console.log('Fetching Baseline...');
    const baseline = await axios.get(url, {
        params: { blogId, userId, provider: 'instagram', limit: 1 },
        headers: { 'X-Mc-Auth': userToken }
    });
    const newestDate = baseline.data.data[0].creationDate;
    console.log(`Newest Item Date: ${newestDate}`);

    // 2. Try 'until' with a date slightly older
    // Let's use yesterday's date
    const date = new Date();
    date.setDate(date.getDate() - 5); // 5 days ago
    const untilDate = date.toISOString(); // Format: 2026-01-10T...
    
    // Clean format for Metricool (sometimes they want simple YYYY-MM-DD or ISO)
    // Try full ISO first
    
    const paramsToTest = ['until', 'to', 'before', 'max_id'];
    
    for (const p of paramsToTest) {
        console.log(`Testing ${p}=${untilDate}...`);
        const res = await axios.get(url, {
            params: { blogId, userId, provider: 'instagram', limit: 1, [p]: untilDate },
            headers: { 'X-Mc-Auth': userToken }
        });
        
        const item = res.data.data[0];
        if (item) {
            console.log(`Result Date: ${item.creationDate}`);
            if (item.creationDate !== newestDate) {
                console.log(`>>> SUCCESS: ${p} changed the result!`);
            } else {
                console.log(`Failed: ${p} ignored (returned newest).`);
            }
        } else {
            console.log(`Got empty list (maybe date was too old or format wrong).`);
        }
    }
};

run();
