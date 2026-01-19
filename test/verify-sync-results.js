require('dotenv').config();
const prisma = require('../utils/prisma');

async function verify() {
    console.log('--- Verifying Sync Results ---');
    
    // Check Jan 12, 2026
    const jan12 = await prisma.instagramAccount.findFirst({
        where: {
            created_at: {
                gte: new Date('2026-01-12T00:00:00'),
                lte: new Date('2026-01-12T23:59:59')
            }
        }
    });
    console.log('Jan 12 DB Record:', JSON.stringify(jan12, null, 2));

    // Check Jan 13, 2026
    const jan13 = await prisma.instagramAccount.findFirst({
        where: {
            created_at: {
                gte: new Date('2026-01-13T00:00:00'),
                lte: new Date('2026-01-13T23:59:59')
            }
        }
    });
    console.log('Jan 13 DB Record:', JSON.stringify(jan13, null, 2));

    // Check Latest Summary
    const summary = await prisma.platformAccountSummary.findFirst({
        where: { platform: 'instagram' }
    });
    console.log('Platform Summary:', JSON.stringify(summary, null, 2));

    // Count Total Rows
    const count = await prisma.instagramAccount.count();
    console.log('Total Instagram Account Rows:', count);

    // Count Content by Type
    const postsCount = await prisma.instagramContentSummary.count({ where: { type: 'post' } });
    const reelsCount = await prisma.instagramContentSummary.count({ where: { type: 'reels' } });
    const storiesCount = await prisma.instagramContentSummary.count({ where: { type: 'story' } });
    console.log(`Content Breakdown: Posts=${postsCount}, Reels=${reelsCount}, Stories=${storiesCount}`);
}

verify()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
