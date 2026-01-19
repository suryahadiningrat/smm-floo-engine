
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const url = `https://app.metricool.com/api/v2/inbox/post-comments`;

    console.log('Fetching Page 1 (offset=0, limit=5)...');
    const page1 = await axios.get(url, {
        params: { blogId, userId, provider: 'instagram', limit: 5, offset: 0 },
        headers: { 'X-Mc-Auth': userToken }
    });
    
    if (page1.data.data.length === 0) {
        console.log('Page 1 is empty.');
        return;
    }
    const firstItemP1 = page1.data.data[0];
    console.log(`Page 1 First Item ID: ${firstItemP1.id} (Created: ${firstItemP1.creationDate})`);

    console.log('Fetching Page 2 (offset=5, limit=5)...');
    const page2 = await axios.get(url, {
        params: { blogId, userId, provider: 'instagram', limit: 5, offset: 5 },
        headers: { 'X-Mc-Auth': userToken }
    });

    if (page2.data.data.length === 0) {
        console.log('Page 2 is empty.');
        return;
    }
    const firstItemP2 = page2.data.data[0];
    console.log(`Page 2 First Item ID: ${firstItemP2.id} (Created: ${firstItemP2.creationDate})`);

    if (firstItemP1.id === firstItemP2.id) {
        console.error('FAIL: Pagination did NOT change the result. Offset might be ignored.');
    } else {
        console.log('SUCCESS: Pagination seems to work (different first items).');
    }
};

run();
