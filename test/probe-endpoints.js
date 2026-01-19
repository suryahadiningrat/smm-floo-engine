const axios = require('axios');
require('dotenv').config();

const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;

async function probeEndpoints() {
    console.log("STARTING ENDPOINT PROBE ------------------------------------------------");
    
    const candidates = [
        'https://app.metricool.com/api/v2/comments',
        'https://app.metricool.com/api/v2/instagram/comments',
        'https://app.metricool.com/api/v2/analytics/comments',
        'https://app.metricool.com/api/v2/community/comments',
        'https://app.metricool.com/api/v2/posts/comments',
        // Try with specific post ID (shortcode)
        `https://app.metricool.com/api/v2/posts/DTPuKKmjiZ9/comments`,
        `https://app.metricool.com/api/v2/analytics/posts/DTPuKKmjiZ9/comments`
    ];
    
    const params = {
        provider: 'instagram',
        userId: '1996313',
        blogId: '3411718',
        limit: 10
    };

    for (const url of candidates) {
        console.log(`\nProbing ${url}...`);
        try {
            const response = await axios.get(url, {
                params,
                headers: {
                    'X-Mc-Auth': USER_TOKEN,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`SUCCESS! Status: ${response.status}`);
            console.log(`Data keys: ${Object.keys(response.data)}`);
            if (response.data.data) console.log(`Items: ${response.data.data.length}`);
        } catch (e) {
            console.log(`Failed: ${e.response ? e.response.status : e.message}`);
        }
    }
    console.log("FINISHED ENDPOINT PROBE ------------------------------------------------");
}

probeEndpoints();