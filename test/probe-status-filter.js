
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const url = `https://app.metricool.com/api/v2/inbox/post-comments`;

    const statuses = ['ALL', 'RESOLVED', 'UNRESOLVED', 'new', 'read', 'archived', 'pending'];

    for (const status of statuses) {
        console.log(`Testing status=${status}...`);
        try {
            const response = await axios.get(url, {
                params: { blogId, userId, provider: 'instagram', limit: 10, status },
                headers: { 'X-Mc-Auth': userToken }
            });
            
            const items = response.data.data;
            if (items.length > 0) {
                const first = items[0];
                const last = items[items.length - 1];
                console.log(`Found ${items.length} items. First: ${first.creationDate}, Last: ${last.creationDate}`);
                
                // Check if status affected the result (compare IDs with baseline)
                // (I'll just look at dates for now)
            } else {
                console.log('No items found.');
            }

        } catch (e) { console.error(e.message); }
    }
};

run();
