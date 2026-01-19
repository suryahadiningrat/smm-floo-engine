require('dotenv').config();
const prisma = require('../utils/prisma');

async function truncate() {
    console.log('Truncating tables...');
    await prisma.$executeRaw`TRUNCATE TABLE metric.instagram_account RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE metric.platform_account_summary RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE metric.instagram_content RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE metric.instagram_content_summary RESTART IDENTITY CASCADE`;
    console.log('Done.');
}

truncate()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
