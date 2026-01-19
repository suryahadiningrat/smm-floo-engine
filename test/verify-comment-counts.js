
const prisma = require('../utils/prisma');

const run = async () => {
    // Get all posts with > 0 comments according to Metricool summary
    const postsWithComments = await prisma.instagramContentSummary.findMany({
        where: { comment: { gt: 0 } },
        select: { content_id: true, comment: true, published_at: true },
        orderBy: { published_at: 'desc' }
    });

    console.log(`Found ${postsWithComments.length} posts that SHOULD have comments.`);

    let discrepancyCount = 0;

    console.log('--- Top 20 Discrepancy Check ---');
    console.log('ContentID | Metricool Count | DB Saved Count | Published At');
    
    for (const post of postsWithComments) {
        const savedCount = await prisma.instagramComment.count({
            where: { content_id: post.content_id }
        });

        if (savedCount < post.comment) {
            if (discrepancyCount < 20) {
                console.log(`${post.content_id.padEnd(11)} | ${post.comment.toString().padEnd(15)} | ${savedCount.toString().padEnd(14)} | ${post.published_at.toISOString().split('T')[0]}`);
            }
            discrepancyCount++;
        }
    }

    console.log(`\nTotal Posts with missing comments: ${discrepancyCount}`);
};

run();
