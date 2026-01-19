
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const url = `https://app.metricool.com/api/v2/inbox/post-comments`;

    // Baseline: Get first 5 items
    console.log('Fetching baseline (limit=5)...');
    const baseline = await axios.get(url, {
        params: { blogId, userId, provider: 'instagram', limit: 5 },
        headers: { 'X-Mc-Auth': userToken }
    });
    
    if (baseline.data.data.length === 0) return;
    const lastItem = baseline.data.data[baseline.data.data.length - 1];
    const lastDate = lastItem.creationDate;
    console.log(`Baseline Last Item Date: ${lastDate}`);

    // Test date params
    const dateParams = ['to', 'until', 'end', 'endDate', 'maxDate', 'before'];
    
    for (const p of dateParams) {
        console.log(`Testing param ${p}=${lastDate}...`);
        try {
            const res = await axios.get(url, {
                params: { blogId, userId, provider: 'instagram', limit: 5, [p]: lastDate },
                headers: { 'X-Mc-Auth': userToken }
            });
            
            const items = res.data.data;
            if (items.length > 0) {
                const first = items[0];
                console.log(`[${p}] First Item Date: ${first.creationDate}`);
                
                if (first.creationDate !== baseline.data.data[0].creationDate) {
                    console.log(`>>> SUCCESS: ${p} changed the result!`);
                } else {
                    console.log(`FAIL: ${p} result identical to baseline.`);
                }
            } else {
                console.log(`[${p}] Returned 0 items. (Might be valid if no older items)`);
            }
        } catch (e) { console.error(e.message); }
    }
};

run();
