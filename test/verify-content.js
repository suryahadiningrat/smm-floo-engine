require('dotenv').config();
const prisma = require('../utils/prisma');

async function verify() {
    console.log('--- Verifying Instagram Content ---');
    
    // Look for the post with shortcode 'DTPuKKmjiZ9'
    const targetShortcode = 'DTPuKKmjiZ9';
    
    const summary = await prisma.instagramContentSummary.findFirst({
        where: { content_id: targetShortcode }
    });
    
    if (summary) {
        console.log('--- Summary Found ---');
        console.log(JSON.stringify(summary, null, 2));
    } else {
        console.log(`--- Summary NOT Found for ${targetShortcode} ---`);
        // Check if it exists with the long ID?
        const longIdCheck = await prisma.instagramContentSummary.findFirst({
            where: { content_id: { contains: '3783659493356985606' } }
        });
        if (longIdCheck) {
            console.log('Found with LONG ID (Issue persists):', longIdCheck.content_id);
        } else {
            console.log('Not found with long ID either.');
        }
    }
    
    console.log('--- Checking Content History (Snapshot) ---');
    const history = await prisma.instagramContent.findMany({
        where: { content_id: targetShortcode },
        orderBy: { created_at: 'desc' },
        take: 1
    });
    
    if (history.length > 0) {
        console.log(JSON.stringify(history[0], null, 2));
    } else {
        console.log('No history found for shortcode.');
    }
}

verify()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());