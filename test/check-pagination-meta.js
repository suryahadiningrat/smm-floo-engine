
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;

    const url = `https://app.metricool.com/api/v2/inbox/post-comments`;
    
    try {
        console.log('Fetching Page 1...');
        const response = await axios.get(url, {
            params: {
                blogId,
                userId,
                provider: 'instagram',
                limit: 10
            },
            headers: { 'X-Mc-Auth': userToken }
        });

        console.log('Response Keys:', Object.keys(response.data));
        if (response.data.meta) {
            console.log('Meta:', response.data.meta);
        }
        if (response.data.paging) {
            console.log('Paging:', response.data.paging);
        }
        
        // Check if items have timestamps to verify sort order
        const items = response.data.data;
        if (items.length > 0) {
            console.log('First Item Date:', items[0].creationDate);
            console.log('Last Item Date:', items[items.length - 1].creationDate);
        }

    } catch (error) {
        console.error(error);
    }
};

run();
