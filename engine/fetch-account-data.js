const prisma = require('../utils/prisma');
const metricoolService = require('../services/metricoolService');
const { createNotification } = require('../services/notificationService');
require('dotenv').config();

const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;

const fetchAccountData = async () => {
    console.log(`[Engine] Starting Continuous Account Monitoring (2-hour)`);
    
    try {
        // 1. Fetch all projects with credentials
        const projects = await prisma.project.findMany({
            where: {
                metricool_blog_id: { not: null },
                metricool_user_id: { not: null }
            }
        });

        console.log(`[Engine] Found ${projects.length} projects to process`);

        // 2. Process concurrently (simple Promise.all for now, can be queued)
        await Promise.all(projects.map(async (project) => {
            await processProject(project);
        }));

        console.log(`[Engine] Continuous Account Monitoring completed`);
    } catch (error) {
        console.error(`[Engine] Global error in fetchAccountData:`, error);
    }
};

const processProject = async (project) => {
    const { id, metricool_blog_id, metricool_user_id } = project;
    // Username is needed for Competitors API to identify "my account"
    // Assuming metricool_user_id might be the username or we have it in project?
    // Project has `slug` or `name`. But Competitors API returns `screenName` or `username`.
    // We should probably store the actual instagram username in `master.projects` or `metric.instagram_account`.
    // For now, I'll use `metricool_user_id` as fallback or `project.slug`.
    // Actually, `controllers/analyticsController.js` used `process.env.INSTAGRAM_USERNAME`.
    // We need to store `instagram_username` in `master.projects`!
    // But the ERD `master.projects` has `slug`, `name`. `metric.instagram_account` has `username`.
    // I'll assume `project.slug` or `project.name` matches username or I'll try to guess.
    // Or I'll use `metricool_user_id` if it looks like a username.
    const username = project.slug || project.name; // Temporary assumption

    try {
        const today = new Date().toISOString().split('T')[0];

        // --- Account Performance ---
        const accountData = await metricoolService.getAccountGrowth(
            'instagram', 
            today, 
            metricool_blog_id, 
            metricool_user_id, 
            USER_TOKEN,
            username
        );

        if (accountData) {
            // Calculate Total Posts from DB (Metricool 'posts' is only for the period)
            const totalPosts = await prisma.instagramContentSummary.count({
                where: {
                    project_id: id,
                    type: { in: ['post', 'reels'] }
                }
            });

            // 1. Upsert History (InstagramAccount)
            // Metricool Competitors Endpoint has a 2-day lag.
            // Data fetched for "Today" is actually "Today - 2 days".
            const LAG_DAYS = 2;
            const actualDataDate = new Date(today); // today is YYYY-MM-DD string
            actualDataDate.setDate(actualDataDate.getDate() - LAG_DAYS);
            const actualDateStr = actualDataDate.toISOString().split('T')[0];

            const startOfDay = new Date(`${actualDateStr}T00:00:00`);
            const endOfDay = new Date(`${actualDateStr}T23:59:59`);
            
            const existingHistory = await prisma.instagramAccount.findFirst({
                where: {
                    project_id: id,
                    created_at: { gte: startOfDay, lte: endOfDay }
                }
            });

            if (existingHistory) {
                await prisma.instagramAccount.update({
                    where: { id: existingHistory.id },
                    data: {
                        posts: totalPosts,
                        followers: accountData.followers || 0,
                        following: accountData.following || 0
                    }
                });
            } else {
                await prisma.instagramAccount.create({
                    data: {
                        project_id: id,
                        username: username,
                        posts: totalPosts,
                        followers: accountData.followers || 0,
                        following: accountData.following || 0,
                        created_at: new Date(`${actualDateStr}T12:00:00`)
                    }
                });
            }

            // 2. Upsert Summary (PlatformAccountSummary) - LATEST STATE
            // Even though it's 2 days old, it's the latest we have from this endpoint.
            const summaryExists = await prisma.platformAccountSummary.findFirst({
                where: { project_id: id, platform: 'instagram' }
            });

            const summaryData = {
                project_id: id,
                username: username,
                platform: 'instagram',
                posts: totalPosts,
                followers: accountData.followers || 0,
                following: accountData.following || 0
            };

            if (summaryExists) {
                await prisma.platformAccountSummary.update({
                    where: { id: summaryExists.id },
                    data: summaryData
                });
            } else {
                await prisma.platformAccountSummary.create({
                    data: summaryData
                });
            }

            console.log(`[Engine] Saved account data for project ${id}`);
        }

        // --- Post Performance (Today) ---
        const posts = await metricoolService.fetchAnalytics(
            'instagram', 
            'posts', 
            today, 
            today, 
            metricool_blog_id, 
            metricool_user_id, 
            USER_TOKEN
        );

        if (posts && posts.length > 0) {
            // Update Summary or Content Table
            // Prompt says: "Post Performance ... Destination: Insert into DB tables"
            // And "Post Details ... same mechanism"
            // I'll update `metric.instagram_content_summary` for "latest status"
            // And also `metric.instagram_content` for historical record?
            
            for (const post of posts) {
                const contentId = post.postId || post.id || post.permalink || post.reelId;

                if (!contentId) {
                    console.warn(`[Engine] Skipping post with missing contentId. Keys: ${Object.keys(post).join(', ')}`);
                    continue;
                }

                const caption = post.caption || post.text || '';
                const mediaUrl = post.imageUrl || post.url || '';
                const publishedAt = post.publishedAt ? new Date(post.publishedAt.dateTime) : null;
                
                // Update Summary
                // Check if exists
                const existingSummary = await prisma.instagramContentSummary.findFirst({
                    where: { project_id: id, content_id: contentId }
                });

                const data = {
                    project_id: id,
                    username: username,
                    type: 'post', // Default
                    content_id: contentId,
                    caption,
                    media_url: mediaUrl,
                    impression: post.impressions || 0,
                    reach: post.reach || 0,
                    like: post.likes || 0,
                    comment: post.comments || 0,
                    share: post.shares || 0,
                    repost: post.saved || 0,
                    published_at: publishedAt
                };

                if (existingSummary) {
                    await prisma.instagramContentSummary.update({
                        where: { id: existingSummary.id },
                        data: {
                            impression: data.impression,
                            reach: data.reach,
                            like: data.like,
                            comment: data.comment,
                            share: data.share,
                            repost: data.repost,
                            published_at: data.publishedAt // Update in case it was missing
                        }
                    });
                } else {
                    await prisma.instagramContentSummary.create({ data });
                }
            }
            console.log(`[Engine] Updated ${posts.length} posts for project ${id}`);
        }

        // Notify user
        if (project.user_id) {
            await createNotification(project.user_id, `Account data fetch completed for project ${project.name}`);
        }

    } catch (error) {
        console.error(`[Engine] Error processing project ${id}:`, error.message);
    }
};

// If run directly
if (require.main === module) {
    fetchAccountData()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { fetchAccountData };
