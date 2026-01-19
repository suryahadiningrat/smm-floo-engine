
const { syncComments } = require('../engine/initial-sync');
const prisma = require('../utils/prisma');
require('dotenv').config();

const run = async () => {
    // Manually run syncComments
    const projectId = 1; // Assuming project ID 1 for now
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP"; 
    
    console.log('--- Triggering Improved Comment Sync ---');
    await syncComments(projectId, blogId, userId, userToken);
    console.log('--- Done ---');
};

run();
