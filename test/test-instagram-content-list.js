
require('dotenv').config();
const prisma = require('../utils/prisma');
const analyticsController = require('../controllers/analyticsController');

// Mock Request and Response
const mockReq = (query) => ({
    query
});

const mockRes = (type) => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        console.log(`--- Test Result: ${type} ---`);
        console.log('Status:', res.statusCode || 200);
        console.log('Count:', Array.isArray(data) ? data.length : 'Not Array');
        if (Array.isArray(data) && data.length > 0) {
            console.log('Sample Item:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('Data:', JSON.stringify(data, null, 2));
        }
        return res;
    };
    return res;
};

const runTest = async () => {
    // 1. Find date range
    const firstContent = await prisma.instagramContent.findFirst({ orderBy: { published_at: 'asc' } });
    const lastContent = await prisma.instagramContent.findFirst({ orderBy: { published_at: 'desc' } });

    if (!firstContent || !lastContent) {
        console.log('No content found to test.');
        return;
    }

    const start_date = firstContent.published_at ? firstContent.published_at.toISOString().split('T')[0] : '2024-01-01';
    const end_date = lastContent.published_at ? lastContent.published_at.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const project_id = firstContent.project_id;

    console.log(`Testing with range: ${start_date} to ${end_date}, Project ID: ${project_id}`);

    const req = mockReq({ start_date, end_date, project_id });

    // Test Posts
    await analyticsController.getInstagramPosts(req, mockRes('Posts'));
    
    // Test Reels
    await analyticsController.getInstagramReels(req, mockRes('Reels'));
    
    // Test Stories
    await analyticsController.getInstagramStories(req, mockRes('Stories'));
};

runTest()
    .catch(err => console.error(err))
    .finally(async () => {
        await prisma.$disconnect();
    });
