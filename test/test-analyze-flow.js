const axios = require('axios');
const prisma = require('../utils/prisma');

const BASE_URL = 'http://localhost:3001/api'; // Port 3001 detected from logs

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const setupData = async () => {
    console.log('Setting up test data...');
    // Ensure project 1 exists
    const project = await prisma.project.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            user_id: 1, // Assume user 1 exists or create
            slug: 'test-project',
            name: 'Test Project'
        }
    });

    // Create Content
    const contentId = 'test_content_123';
    await prisma.instagramContent.upsert({
        where: { id: 9999 }, // specific ID to avoid conflict
        update: {},
        create: {
            id: 9999,
            project_id: 1,
            username: 'testuser',
            type: 'post',
            content_id: contentId,
            caption: 'This is a test post for AI analysis. We love this product!',
            media_url: 'http://example.com/image.jpg',
            published_at: new Date()
        }
    });

    // Create Comments
    await prisma.instagramComment.createMany({
        data: [
            {
                project_id: 1,
                content_id: contentId,
                commenters_username: 'user1',
                text: 'Amazing product! I love it.',
                sentiment: null,
                created_at: new Date()
            },
            {
                project_id: 1,
                content_id: contentId,
                commenters_username: 'user2',
                text: 'Terrible experience. Hated it.',
                sentiment: null,
                created_at: new Date()
            },
            {
                project_id: 1,
                content_id: contentId,
                commenters_username: 'user3',
                text: 'It is okay, nothing special.',
                sentiment: null,
                created_at: new Date()
            }
        ]
    });
    
    console.log('Test data created.');
    return contentId;
};

const runTest = async () => {
    try {
        const contentId = await setupData();
        const keyword = 'product';

        console.log('1. Triggering Analysis...');
        const triggerRes = await axios.post(`${BASE_URL}/instagram/post-analyze`, {
            content_id: contentId,
            keyword: keyword,
            project_id: 1
        });
        
        console.log('Trigger Response:', triggerRes.status, triggerRes.data);
        const analyzeId = triggerRes.data.job_id;

        console.log(`2. Polling for status (Job ID: ${analyzeId})...`);
        
        let attempts = 0;
        let complete = false;
        
        while (attempts < 20 && !complete) {
            await sleep(2000);
            try {
                const statusRes = await axios.get(`${BASE_URL}/users/analyze/${analyzeId}`);
                if (statusRes.status === 200) {
                    console.log('Analysis Complete!');
                    console.log('Result:', JSON.stringify(statusRes.data, null, 2));
                    complete = true;
                } else if (statusRes.status === 202) {
                    console.log(`Still processing... (${statusRes.data.percentage}%)`);
                }
            } catch (err) {
                console.log('Polling Error:', err.message);
            }
            attempts++;
        }

        if (!complete) {
            console.error('Timeout waiting for analysis.');
        }

        console.log('3. Checking List Endpoint...');
        const listRes = await axios.get(`${BASE_URL}/users/analyze?project_id=1`);
        console.log('List Response:', listRes.data.length > 0 ? 'Found entries' : 'Empty');

        console.log('4. Verifying DB Updates...');
        const comments = await prisma.instagramComment.findMany({
            where: { content_id: contentId }
        });
        console.log('Comments with sentiment:', comments.map(c => `${c.text.substring(0, 10)}... -> ${c.sentiment}`));

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    } finally {
        await prisma.$disconnect();
    }
};

runTest();
