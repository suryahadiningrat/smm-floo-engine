const axios = require('axios');
require('dotenv').config();

const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;

async function fetchAndAnalyze() {
    const url = `https://app.metricool.com/api/v2/inbox/conversations`;
    const params = {
        provider: 'instagram',
        userId: '1996313',
        blogId: '3411718',
        limit: 100
    };

    console.log(`\nRequesting 100 items...`);
    try {
        const response = await axios.get(url, {
            params,
            headers: {
                'X-Mc-Auth': USER_TOKEN,
                'Content-Type': 'application/json',
                'user-agent': 'Mozilla/5.0'
            }
        });

        const items = response.data.data || [];
        console.log(`Fetched ${items.length} items.`);

        // Count types
        let storyCount = 0;
        let commentCount = 0;
        let otherCount = 0;
        let comments = [];

        items.forEach(item => {
            if (item.properties && item.properties.story) {
                storyCount++;
            } else if (item.text && item.text.length > 0) {
                // Assuming items with text are comments or DMs
                // Check if it's related to a post
                if (item.properties && item.properties.post) {
                    commentCount++;
                    comments.push(item);
                } else {
                    otherCount++;
                    // Maybe a DM?
                }
            } else {
                otherCount++;
            }
        });

        console.log(`Analysis:`);
        console.log(`- Story Mentions/Reactions: ${storyCount}`);
        console.log(`- Post Comments: ${commentCount}`);
        console.log(`- Other (Empty text/Unknown): ${otherCount}`);

        if (comments.length > 0) {
            console.log('\nFound a comment! Structure:');
            console.log(JSON.stringify(comments[0], null, 2));
        } else {
            console.log('\nNo comments found in the first batch.');
            // Try to find ANY item that is NOT a story
            const nonStory = items.find(i => !i.properties?.story);
            if (nonStory) {
                console.log('\nFound a non-story item:');
                console.log(JSON.stringify(nonStory, null, 2));
            }
        }

    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

fetchAndAnalyze();
