
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
    
    if (baseline.data.data.length === 0) return;
    const firstId = baseline.data.data[0].id;
    console.log(`Baseline First ID: ${firstId}`);

    // Probe params
    const params = ['skip', 'page', 'p', 'start', 'index'];

    for (const p of params) {
        // Test with value 1 (for page) or 5 (for skip/index)
        const val = (p === 'page' || p === 'p') ? 2 : 5;
        console.log(`Testing ${p}=${val}...`);
        try {
            const res = await axios.get(url, {
                params: { blogId, userId, provider: 'instagram', limit: 5, [p]: val },
                headers: { 'X-Mc-Auth': userToken }
            });
            
            const newFirstId = res.data.data[0].id;
            if (newFirstId !== firstId) {
                console.log(`>>> SUCCESS: ${p} changed the result! First ID: ${newFirstId}`);
            } else {
                console.log(`FAIL: ${p} ignored.`);
            }
        } catch (e) { console.error(e.message); }
    }
};

run();
