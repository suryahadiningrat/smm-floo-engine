require('dotenv').config();
const metricoolService = require('../services/metricoolService');

const BLOG_ID = '3411718';
const USER_ID = '1996313';
const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;

async function inspect() {
    console.log('--- Inspecting Raw Post Data ---');
    try {
        // Fetch posts from a recent range (e.g. last 30 days or specific date if known)
        // User mentioned a post from "2025-12-09" (Wait, 2025? User said 2025-12-09 in DB row, but today is 2026-01-15. So it's a month ago.)
        // Actually, let's fetch a wider range to be sure.
        const posts = await metricoolService.fetchAnalytics(
            'instagram',
            'posts',
            '2025-12-01',
            '2026-01-14',
            BLOG_ID,
            USER_ID,
            USER_TOKEN
        );

        console.log(`Fetched ${posts.length} posts.`);
        
        if (posts.length > 0) {
            // Find the specific post if possible, or just dump the first few
            // The user showed content_id 3783659493356985606_2020183519
            const target = posts.find(p => p.contentId && p.contentId.includes('3783659493356985606'));
            
            if (target) {
                console.log('--- TARGET POST FOUND ---');
                console.log(JSON.stringify(target, null, 2));
            } else {
                console.log('--- TARGET NOT FOUND, DUMPING FIRST ITEM ---');
                console.log(JSON.stringify(posts[0], null, 2));
            }
        }
    } catch (err) {
        console.error(err);
    }
}

inspect();