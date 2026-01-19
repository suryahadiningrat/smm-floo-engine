
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const url = `https://app.metricool.com/api/v2/inbox/post-comments`;

    const res = await axios.get(url, {
        params: { blogId, userId, provider: 'instagram', limit: 5 },
        headers: { 'X-Mc-Auth': userToken }
    });
    
    const items = res.data.data;
    const target = items.find(i => i.root.element && i.root.element.link && i.root.element.link.includes('DTh2lMkDuOX'));

    if (target) {
            console.log('Found Target Element:');
            console.log(JSON.stringify(target, null, 2));
        } else {
            console.log('Target NOT found in first 5 items.');
            if (items.length > 0) {
                console.log('Dumping FIRST item structure instead:');
                console.log(JSON.stringify(items[0], null, 2));
            }
        }
};

run();
