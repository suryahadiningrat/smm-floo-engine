
const prisma = require('../utils/prisma');

const run = async () => {
    // 1. Check a sample of content_ids
    const contents = await prisma.instagramContent.findMany({
        take: 20,
        select: { content_id: true, type: true, published_at: true },
        orderBy: { published_at: 'desc' }
    });
    console.log('--- Sample Content IDs in DB ---');
    console.table(contents);

    // 2. Check how many comments we have and which content_ids they belong to
    const comments = await prisma.instagramComment.groupBy({
        by: ['content_id'],
        _count: { id: true }
    });
    console.log('\n--- Comments grouped by Content ID ---');
    console.table(comments);
};

run();
