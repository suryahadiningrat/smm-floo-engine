
const prisma = require('../utils/prisma');

const run = async () => {
    const totalComments = await prisma.instagramComment.count();
    console.log(`Total Comments in DB: ${totalComments}`);

    const byContent = await prisma.instagramComment.groupBy({
        by: ['content_id'],
        _count: { id: true }
    });
    console.log('Comments by Content ID:');
    console.table(byContent);
};

run();
