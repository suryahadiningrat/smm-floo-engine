
const axios = require('axios');
const prisma = require('../utils/prisma');
require('dotenv').config();

const run = async () => {
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const projectId = 1;

    const url = `https://app.metricool.com/api/v2/inbox/post-comments`;
    
    try {
        const response = await axios.get(url, {
            params: { blogId, userId, provider: 'instagram', limit: 100 },
            headers: { 'X-Mc-Auth': userToken }
        });

        const items = response.data.data;
        console.log(`Fetched ${items.length} comments.`);

        let matched = 0;
        let missing = 0;
        const missingSamples = [];

        for (const item of items) {
            const link = item.root.element.link;
            const numericId = item.root.element.id;
            let shortcode = null;

            if (link) {
                if (link.includes('/p/')) {
                    shortcode = link.split('/p/')[1].split('/')[0].split('?')[0];
                } else if (link.includes('/reel/')) {
                    shortcode = link.split('/reel/')[1].split('/')[0].split('?')[0];
                }
            }

            // Check DB
            const byShortcode = shortcode ? await prisma.instagramContent.findFirst({ where: { content_id: shortcode } }) : null;
            const byNumeric = numericId ? await prisma.instagramContent.findFirst({ where: { content_id: numericId } }) : null;

            if (byShortcode || byNumeric) {
                matched++;
            } else {
                missing++;
                if (missingSamples.length < 5) {
                    missingSamples.push({ shortcode, numericId, link });
                }
            }
        }

        console.log(`Matched: ${matched}`);
        console.log(`Missing: ${missing}`);
        console.log('Sample Missing Content:', missingSamples);

    } catch (error) {
        console.error(error);
    }
};

run();
