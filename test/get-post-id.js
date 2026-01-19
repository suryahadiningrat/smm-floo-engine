const prisma = require('../utils/prisma');

async function run() {
    try {
        const post = await prisma.instagramContentSummary.findFirst({
            where: { type: 'post' },
            orderBy: { published_at: 'desc' }
        });
        
        if (post) {
            console.log('POST ID:', post.content_id);
            console.log('Published At:', post.published_at);
        } else {
            console.log('No posts found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
