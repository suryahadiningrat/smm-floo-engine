
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const url = `https://app.metricool.com/api/v2/inbox/post-comments`;

    const shortcode = "DTPuKKmjiZ9"; // The post user mentioned
    
    // Test filtering by post ID
    const paramsToTest = ['postId', 'post_id', 'contentId', 'content_id', 'mediaId', 'media_id', 'shortcode', 'q', 'query', 'filter'];
    
    for (const p of paramsToTest) {
        console.log(`Testing ${p}=${shortcode}...`);
        try {
            const res = await axios.get(url, {
                params: { blogId, userId, provider: 'instagram', limit: 10, [p]: shortcode },
                headers: { 'X-Mc-Auth': userToken }
            });
            
            // Check if returned items match the shortcode
            const items = res.data.data;
            if (items.length > 0) {
                const first = items[0];
                const link = first.root.element.link || '';
                if (link.includes(shortcode)) {
                    console.log(`>>> SUCCESS: ${p} filtered the results! Found ${items.length} comments.`);
                    return;
                } else {
                    console.log(`Failed: ${p} returned unrelated items (Link: ${link})`);
                }
            } else {
                console.log(`Failed: ${p} returned empty list.`);
            }
        } catch (e) { console.error(e.message); }
    }
};

run();
