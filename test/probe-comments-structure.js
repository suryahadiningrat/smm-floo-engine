
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
                limit: 20 // Fetch a small batch to inspect
            },
            headers: {
                'X-Mc-Auth': userToken,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data.data;
        console.log(`Fetched ${data.length} items.`);

        // Group by Post URL/ID to see diversity
        const posts = {};
        data.forEach(item => {
            const postUrl = item.post ? item.post.url : 'NO_POST_OBJECT';
            const postId = item.post ? item.post.id : 'NO_ID';
            const key = `${postId}|${postUrl}`;
            
            if (!posts[key]) posts[key] = 0;
            posts[key]++;
        });

        console.log('\n--- Comment Distribution in Page 1 ---');
        Object.keys(posts).forEach(key => {
            console.log(`${key}: ${posts[key]} comments`);
        });

        // Inspect one full item
        if (data.length > 0) {
            console.log('\n--- Sample Item Structure ---');
            console.log(JSON.stringify(data[0], null, 2));
        }

    } catch (error) {
        console.error('Failed:', error.message);
        if (error.response) console.error(error.response.data);
    }
};

run();
