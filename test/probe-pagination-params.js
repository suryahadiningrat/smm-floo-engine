
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const url = `https://app.metricool.com/api/v2/inbox/post-comments`;

    // Baseline: limit=5
    const baseline = await axios.get(url, {
        params: { blogId, userId, provider: 'instagram', limit: 5 },
        headers: { 'X-Mc-Auth': userToken }
    });
    const lastId = baseline.data.data[baseline.data.data.length - 1].id;
    console.log(`Baseline Last ID: ${lastId}`);

    // Probe params
    const params = ['fromId', 'afterId', 'startId', 'sinceId', 'maxId', 'nextPageToken', 'pageToken', 'cursor', 'after'];

    for (const p of params) {
        console.log(`Testing ${p}=${lastId}...`);
        try {
            const res = await axios.get(url, {
                params: { blogId, userId, provider: 'instagram', limit: 5, [p]: lastId },
                headers: { 'X-Mc-Auth': userToken }
            });
            
            const firstId = res.data.data[0].id;
            if (firstId !== baseline.data.data[0].id) {
                console.log(`>>> SUCCESS: ${p} changed the result! First ID: ${firstId}`);
            } else {
                console.log(`FAIL: ${p} ignored.`);
            }
        } catch (e) { console.error(e.message); }
    }

    // Check Limit > 100
    console.log('Testing Limit=200...');
    const resLimit = await axios.get(url, {
        params: { blogId, userId, provider: 'instagram', limit: 200 },
        headers: { 'X-Mc-Auth': userToken }
    });
    console.log(`Limit=200 fetched ${resLimit.data.data.length} items.`);
};

run();
