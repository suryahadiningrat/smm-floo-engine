
require('dotenv').config();
const prisma = require('../utils/prisma');
const analyticsController = require('../controllers/analyticsController');

// Mock Request and Response
const mockReq = (query) => ({
    query
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        console.log('Response Status:', res.statusCode || 200);
        console.log('Response Data:', JSON.stringify(data, null, 2));
        return res;
    };
    return res;
};

const runTest = async () => {
    // 1. Find date range from DB
    const firstContent = await prisma.instagramContent.findFirst({ orderBy: { published_at: 'asc' } });
    const lastContent = await prisma.instagramContent.findFirst({ orderBy: { published_at: 'desc' } });

    if (!firstContent || !lastContent) {
        console.log('No content found to test dates.');
        return;
    }

    const start_date = firstContent.published_at ? firstContent.published_at.toISOString().split('T')[0] : '2024-01-01';
    const end_date = lastContent.published_at ? lastContent.published_at.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const project_id = firstContent.project_id;

    console.log(`Testing with range: ${start_date} to ${end_date}, Project ID: ${project_id}`);

    const req = mockReq({ start_date, end_date, project_id });
    const res = mockRes();

    await analyticsController.getInstagramMetrics(req, res);
};

runTest()
    .catch(err => console.error(err))
    .finally(async () => {
        await prisma.$disconnect();
    });
