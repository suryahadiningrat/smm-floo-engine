
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const url = `https://app.metricool.com/api/v2/inbox/post-comments`;

    // 1. Get Baseline (Limit 10)
    const baseline = await axios.get(url, {
        params: { blogId, userId, provider: 'instagram', limit: 10 },
        headers: { 'X-Mc-Auth': userToken }
    });
    const lastItem = baseline.data.data[baseline.data.data.length - 1];
    const lastId = lastItem.id;
    console.log(`Baseline Last ID: ${lastId} (Date: ${lastItem.creationDate})`);

    // 2. Try ID-based pagination params
    const params = ['maxId', 'max_id', 'after', 'afterId', 'startId', 'fromId', 'nextPageToken', 'pageToken', 'cursor'];
    
    for (const p of params) {
        console.log(`Testing ${p}=${lastId}...`);
        try {
            const res = await axios.get(url, {
                params: { blogId, userId, provider: 'instagram', limit: 1, [p]: lastId },
                headers: { 'X-Mc-Auth': userToken }
            });
            const first = res.data.data[0];
            if (first && first.id !== baseline.data.data[0].id) {
                console.log(`>>> SUCCESS: ${p} worked! New First ID: ${first.id}`);
            } else {
                console.log(`Failed: ${p} ignored.`);
            }
        } catch (e) { console.error(e.message); }
    }
};

run();
