const analyticsController = require('../controllers/analyticsController');
const prisma = require('../utils/prisma');

// Mock Request and Response
const mockReq = (body) => ({
    body
});

const runTest = async () => {
    // 1. Find a post with comments
    console.log('Finding a post with comments...');
    const comment = await prisma.instagramComment.findFirst(100);
    console.log(comment);
    
    if (!comment) {
        console.log('No comments found in DB to test.');
        return;
    }

    const postId = comment.content_id;
    console.log(`Testing with Post ID: ${postId}`);

    // 2. Test Controller
    const req = mockReq({
        post_id: postId,
        keyword: 'ban' // "ban" means tire in Indonesian, relevant to FDR Tire
    });
    const res = mockRes();

    console.log('Invoking analyzeInstagramComments...');
    await analyticsController.analyzeInstagramComments(req, res);
};

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        console.log('Response Status:', res.statusCode || 200);
        // Log summary only to verify percentages
        const summary = { ...data };
        delete summary.detail;
        console.log('Response Summary:', JSON.stringify(summary, null, 2));
        
        // Log Detail Preview (first 2 items of each category)
        const preview = {
            positive_preview: data.detail.positive_sentiments.slice(0, 2),
            negative_preview: data.detail.negative_sentiments.slice(0, 2),
            neutral_preview: data.detail.neutral_sentiments.slice(0, 2),
            relate_preview: data.detail.relate_comments.slice(0, 2)
        };
        console.log('Response Detail Preview:', JSON.stringify(preview, null, 2));
        
        return res;
    };
    return res;
};

runTest()
    .catch(err => console.error(err))
    .finally(async () => {
        await prisma.$disconnect();
    });
