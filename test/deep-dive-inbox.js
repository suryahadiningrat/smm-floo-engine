
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const url = `https://app.metricool.com/api/v2/inbox/conversations`;

    console.log('Fetching conversations...');
    try {
        const response = await axios.get(url, {
            params: { blogId, userId, provider: 'instagram', limit: 50 }, // Fetch 50
            headers: { 'X-Mc-Auth': userToken }
        });

        const items = response.data.data;
        console.log(`Found ${items.length} items.`);

        const types = {};
        for (const item of items) {
            types[item.type] = (types[item.type] || 0) + 1;
            if (item.type !== 'message') {
                console.log(`FOUND NON-MESSAGE: ${item.type}`);
                console.log(JSON.stringify(item, null, 2));
            }
        }
        console.log('Type distribution:', types);

    } catch (e) { console.error(e.message); }
};

run();
