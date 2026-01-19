const prisma = require('../utils/prisma');

async function checkPostCommentsCount() {
    try {
        const contentId = 'DTPuKKmjiZ9';
        console.log(`Checking comments_count for content_id: ${contentId}`);

        const content = await prisma.instagramContent.findFirst({
            where: { content_id: contentId }
        });

        if (content) {
            console.log('Content found:', content);
            console.log(`Comments count: ${content.comments_count}`);
        } else {
            console.log('Content not found in DB.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        // await prisma.$disconnect(); // utils/prisma handles connection
    }
}

checkPostCommentsCount();