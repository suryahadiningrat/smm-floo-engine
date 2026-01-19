
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = process.env.METRICOOL_USER_TOKEN;
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const contentId = "DTPuKKmjiZ9"; // The known post ID

    console.log(`--- Probing Comment Endpoints for Content ${contentId} ---`);

    const tryUrl = async (url) => {
        try {
            console.log(`Testing: ${url}`);
            const response = await axios.get(url, {
                params: { blogId, userId },
                headers: { 'X-Mc-Auth': userToken }
            });
            console.log(`[SUCCESS] Status: ${response.status}`);
            console.log(JSON.stringify(response.data, null, 2).substring(0, 200));
        } catch (error) {
            console.log(`[FAILED] ${error.response ? error.response.status : error.message}`);
        }
    };

    const base = 'https://app.metricool.com/api/v2';
    
    // Guessing common REST patterns
    await tryUrl(`${base}/analytics/instagram/posts/${contentId}/comments`);
    await tryUrl(`${base}/analytics/instagram/media/${contentId}/comments`);
    await tryUrl(`${base}/instagram/posts/${contentId}/comments`);
    await tryUrl(`${base}/social-network/instagram/media/${contentId}/comments`);
    await tryUrl(`${base}/social-network/instagram/posts/${contentId}/comments`);
    
    // Try without plural
    await tryUrl(`${base}/analytics/instagram/post/${contentId}/comments`);
};

run();
