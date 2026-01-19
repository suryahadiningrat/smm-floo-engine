
const axios = require('axios');
require('dotenv').config();

const run = async () => {
    const targetId = "aWdfZAG06MTpJR01lc3NhZA2VUaHJlYWQ6MTc4NDE0MDIxNDU1ODI1MjI6MzQwMjgyMzY2ODQxNzEwMzAxMjQ0MjYwMTIzNDY3MjYwMzA5NjU4";
    const userToken = process.env.METRICOOL_USER_TOKEN;
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;

    console.log('--- Debugging Inbox List (Deep Search) ---');
    console.log(`Searching for ID ending in ...09658`);

    try {
        const url = `https://app.metricool.com/api/v2/inbox/conversations`;
        
        let found = false;
        let offset = 0;
        const limit = 50;

        while (!found && offset < 200) {
            console.log(`Fetching offset ${offset}...`);
            const response = await axios.get(url, {
                params: {
                    blogId,
                    userId,
                    provider: 'instagram',
                    limit: limit,
                    offset: offset
                },
                headers: {
                    'X-Mc-Auth': userToken,
                    'Content-Type': 'application/json'
                }
            });

            const conversations = response.data.data;
            if (conversations.length === 0) break;

            const target = conversations.find(c => c.id === targetId);
            if (target) {
                console.log('\n!!! FOUND TARGET CONVERSATION !!!');
                console.log(JSON.stringify(target, null, 2));
                found = true;
            } else {
                // Check if any conversation has messages that look like comments
                conversations.forEach((c, idx) => {
                    if (c.messages && c.messages.some(m => m.type === 'IGComment' || m.text?.includes('keren kak'))) {
                         console.log(`\n[Potential Match at ${offset + idx}]`);
                         console.log(JSON.stringify(c, null, 2));
                    }
                });
            }
            offset += limit;
        }

        if (!found) {
            console.log('Target ID not found in first 200 items.');
        }

    } catch (error) {
        console.error('Failed list fetch:', error.message);
    }
};

run();
