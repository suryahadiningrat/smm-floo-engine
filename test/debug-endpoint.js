const axios = require('axios');
require('dotenv').config();

const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;
const TARGET_CONTENT_ID = 'DTPuKKmjiZ9';

async function findCommentsForPost() {
    console.log(`STARTING SEARCH FOR CONTENT ${TARGET_CONTENT_ID} ----------------`);
    const url = `https://app.metricool.com/api/v2/inbox/conversations`;
    
    const params = {
        provider: 'instagram',
        userId: '1996313',
        blogId: '3411718',
        limit: 50 // Fetch more conversations
    };

    try {
        const response = await axios.get(url, {
            params,
            headers: {
                'X-Mc-Auth': USER_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        const conversations = response.data.data || [];
        console.log(`Fetched ${conversations.length} conversations.`);
        
        let foundCount = 0;
        let commentTypeCount = 0;
        let dmTypeCount = 0;

        for (const conv of conversations) {
            const messages = conv.messages || [];
            for (const msg of messages) {
                // Check properties
                const props = msg.properties || {};
                const post = props.post || {};
                
                // Check if it's related to a post
                if (post.id || props.mediaId) {
                    commentTypeCount++;
                    // Check if it matches our target
                    if (post.id === TARGET_CONTENT_ID || post.shortcode === TARGET_CONTENT_ID || props.mediaId === TARGET_CONTENT_ID || (post.url && post.url.includes(TARGET_CONTENT_ID))) {
                        console.log('--- FOUND MATCHING COMMENT ---');
                        console.log(JSON.stringify(msg, null, 2));
                        foundCount++;
                    }
                } else {
                    dmTypeCount++;
                }
            }
        }

        console.log(`\nSummary:`);
        console.log(`- Total Messages scanned: ${dmTypeCount + commentTypeCount}`);
        console.log(`- DMs/Other: ${dmTypeCount}`);
        console.log(`- Post Comments: ${commentTypeCount}`);
        console.log(`- Matches for ${TARGET_CONTENT_ID}: ${foundCount}`);

        if (foundCount === 0 && commentTypeCount > 0) {
             console.log("\nFound some comments, but not for the target post. Showing a sample comment:");
             // Find first comment
             for (const conv of conversations) {
                 for (const msg of conv.messages) {
                     if (msg.properties && (msg.properties.post || msg.properties.mediaId)) {
                         console.log(JSON.stringify(msg, null, 2));
                         return;
                     }
                 }
             }
        }

    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
    console.log("FINISHED SEARCH ------------------------------------------------");
}

findCommentsForPost();