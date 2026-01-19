const axios = require('axios');
require('dotenv').config();

const USER_ID = '1996313';
const BLOG_ID = '3411718';
const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;

async function fetchWithParams(extraParams) {
    const url = `https://app.metricool.com/api/v2/inbox/conversations`;
    const params = {
        provider: 'instagram',
        userId: USER_ID,
        blogId: BLOG_ID,
        limit: 100,
        ...extraParams
    };
    console.log(`\nRequesting with params:`, params);
    
    try {
        const response = await axios.get(url, {
            params,
            headers: {
                'X-Mc-Auth': USER_TOKEN,
                'Content-Type': 'application/json',
                'user-agent': 'Mozilla/5.0'
            }
        });
        
        console.log('Headers:', JSON.stringify(response.headers, null, 2));

        const data = response.data;
        console.log('Response Keys:', Object.keys(data));
        if (data.meta) console.log('Meta:', JSON.stringify(data.meta, null, 2));
        if (data.links) console.log('Links:', JSON.stringify(data.links, null, 2));
        
        if (data.data && Array.isArray(data.data)) {
            console.log(`Fetched ${data.data.length} items.`);
            
            // Log the first item fully to understand the structure
            if (data.data.length > 0) {
                console.log('First Item Structure:', JSON.stringify(data.data[0], null, 2));
            }

            const withText = data.data.filter(i => i.text && i.text.length > 0);
            console.log(`Items with text: ${withText.length}`);
            if (withText.length > 0) {
                console.log('Sample with text:', JSON.stringify(withText[0], null, 2));
            }
        }
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

async function run() {
    console.log('--- Verifying User Endpoint ---');
    if (!USER_TOKEN) {
        console.error('No METRICOOL_USER_TOKEN found in environment');
        return;
    }

    // Try default
    await fetchWithParams({});
    
    // Try explicit types
    await fetchWithParams({ type: 'IGComment' });
    await fetchWithParams({ type: 'comment' });
    await fetchWithParams({ status: 'all' }); // Maybe status filter hides things

    // Try filtering by Content ID
    const CONTENT_ID = 'DTPuKKmjiZ9';
    await fetchWithParams({ contentId: CONTENT_ID });
    await fetchWithParams({ postId: CONTENT_ID });
    await fetchWithParams({ mediaId: CONTENT_ID });
    
    // Try searching text
    await fetchWithParams({ q: 'keren' }); // Search query?
}

run();
