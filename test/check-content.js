
const prisma = require('../utils/prisma');

const run = async () => {
    try {
        const content = await prisma.instagramContentSummary.findFirst({
            where: { content_id: 'DTPuKKmjiZ9' }
        });
        
        if (content) {
            console.log('Content found in DB:');
            console.log(content);
        } else {
            console.log('Content DTPuKKmjiZ9 NOT found in DB.');
             // Check by shortcode?
             const contentByShortcode = await prisma.instagramContentSummary.findFirst({
                 where: { content_id: { contains: 'DTPuKKmjiZ9' } }
             });
             if (contentByShortcode) {
                 console.log('Found similar ID:', contentByShortcode);
             }
        }
    } catch (err) {
        console.error(err);
    }
};

run();
