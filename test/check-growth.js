const prisma = require('../utils/prisma');

async function checkGrowth() {
    const contentId = 'DTPuKKmjiZ9';
    console.log(`Checking growth data for content_id: ${contentId}`);

    try {
        const growth = await prisma.instagramContent.findMany({
            where: {
                content_id: contentId
            },
            orderBy: {
                created_at: 'asc'
            }
        });

        console.log(`Found ${growth.length} rows.`);
        console.table(growth);

        // Also check the content summary
        const summary = await prisma.instagramContentSummary.findFirst({
            where: {
                content_id: contentId
            }
        });
        console.log('Content Summary:');
        console.log(summary);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkGrowth();
