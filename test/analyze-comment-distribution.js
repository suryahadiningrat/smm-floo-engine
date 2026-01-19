
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const url = `https://app.metricool.com/api/v2/inbox/post-comments`;

    console.log('Fetching comments (Limit 500)...');
    try {
        const response = await axios.get(url, {
            params: { blogId, userId, provider: 'instagram', limit: 500 },
            headers: { 'X-Mc-Auth': userToken }
        });

        const items = response.data.data;
        console.log(`Fetched ${items.length} items.`);

        const postCounts = {};
        for (const item of items) {
            const link = item.root.element.link || 'unknown';
            postCounts[link] = (postCounts[link] || 0) + 1;
        }

        console.log('Post Distribution:');
        Object.entries(postCounts).forEach(([link, count]) => {
            console.log(`${count} comments on ${link}`);
        });

    } catch (e) { console.error(e.message); }
};

run();
