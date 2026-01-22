const prisma = require('./utils/prisma');

async function resetSentiment() {
    try {
        const contentId = 'DS4i9MKjuwY';
        console.log(`Resetting sentiment for content: ${contentId}`);

        const result = await prisma.instagramComment.updateMany({
            where: {
                content_id: contentId
            },
            data: {
                sentiment: null
            }
        });

        console.log(`Updated ${result.count} comments. Sentiment set to null.`);
    } catch (error) {
        console.error('Error resetting sentiment:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetSentiment();
