
require('dotenv').config();
const metricoolService = require('../services/metricoolService');

const run = async () => {
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const userToken = process.env.METRICOOL_USER_TOKEN;

    if (!blogId || !userId || !userToken) {
        console.error('Missing env vars');
        return;
    }

    try {
        console.log(`Using BlogID: ${blogId}, UserID: ${userId}`);
        
        // Try alternate provider
        console.log('Testing provider=instagram_business ...');
        try {
            const conversations = await metricoolService.fetchInboxConversations(blogId, userId, userToken, { provider: 'instagram_business', limit: 10 });
            console.log(`Fetched ${conversations.length} conversations.`);
        } catch (e) {
            console.log('Failed or empty.');
        }

        // Try searching by text content if any comment is known?
        // No known comment text.

    } catch (error) {
        console.error('Error:', error.message);
    }
};

run();
