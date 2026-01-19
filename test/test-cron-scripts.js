const { fetchAccountData } = require('../engine/fetch-account-data');
const { dailyAggregation } = require('../engine/daily-aggregation');
const prisma = require('../utils/prisma');

async function test() {
    console.log('--- Testing Fetch Account Data (2-hour Cron) ---');
    // Count before
    const accountCountBefore = await prisma.instagramAccount.count();
    console.log(`InstagramAccount rows before: ${accountCountBefore}`);

    await fetchAccountData();

    // Count after
    const accountCountAfter = await prisma.instagramAccount.count();
    console.log(`InstagramAccount rows after: ${accountCountAfter}`);

    console.log('\n--- Testing Daily Aggregation (Daily Cron) ---');
    // Count before
    const contentCountBefore = await prisma.instagramContent.count();
    console.log(`InstagramContent rows before: ${contentCountBefore}`);

    await dailyAggregation();

    // Count after
    const contentCountAfter = await prisma.instagramContent.count();
    console.log(`InstagramContent rows after: ${contentCountAfter}`);

    // Verify Summary Updates
    // Just check if count > 0
    const summaryCount = await prisma.instagramContentSummary.count();
    console.log(`InstagramContentSummary rows: ${summaryCount}`);
    
    await prisma.$disconnect();
}

test();
