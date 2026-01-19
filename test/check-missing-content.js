
const prisma = require('../utils/prisma');

const run = async () => {
    const shortcode = 'DTh2lMkDuOX';
    const content = await prisma.instagramContent.findFirst({
        where: { content_id: shortcode }
    });

    const summary = await prisma.instagramContentSummary.findFirst({
        where: { content_id: shortcode }
    });

    console.log(`Checking for content_id: ${shortcode}`);
    if (content) {
        console.log('Found in Content (History):', content);
    } else {
        console.log('Not Found in Content (History).');
    }

    if (summary) {
        console.log('Found in Summary:', summary);
    } else {
        console.log('Not Found in Summary.');
    }
    
    // Check comments
    const comments = await prisma.instagramComment.findMany({
        where: { content_id: shortcode }
    });
    console.log(`Found ${comments.length} comments in DB.`);
    console.log(comments);
    
    
    // Check recent contents to see what we DO have
    const recent = await prisma.instagramContent.findMany({
        take: 5,
        orderBy: { published_at: 'desc' },
        select: { content_id: true, published_at: true }
    });
    console.log('Recent Contents in DB:', recent);
};

run();
