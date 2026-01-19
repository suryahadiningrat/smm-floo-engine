
const { PrismaClient } = require('@prisma/client');
const prisma = require('../utils/prisma');
const metricoolService = require('../services/metricoolService');
require('dotenv').config();

const run = async () => {
    const project = await prisma.project.findFirst();
    if (!project) return;
    
    const projectId = project.id;
    const blogId = process.env.METRICOOL_BLOG_ID;
    const userId = process.env.METRICOOL_USER_ID;
    const userToken = "ILGUJZAVHMCOKEFMPMVKHRVNVXYRLAIZPOFEKPNSFPRKDHDWSGWDOPZOTRABWJGP";

    // Date Range: Last 30 days
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const from = fromDate.toISOString().split('T')[0];

    console.log(`Fetching posts from ${from} to ${to}...`);

    const items = await metricoolService.fetchAnalytics('instagram', 'posts', from, to, blogId, userId, userToken);
    console.log(`Fetched ${items.length} posts.`);

    const targetShortcode = 'DTh2lMkDuOX';
    let targetFound = false;

    for (const item of items) {
        let contentId = item.postId || item.id || item.reelId || item.contentId;
        const url = item.url || item.permalink;
        
        // Extract shortcode
        if (url) {
            const cleanUrl = url.split('?')[0];
            if (cleanUrl.includes('/p/')) {
                const parts = cleanUrl.split('/p/');
                if (parts.length > 1) contentId = parts[1].replace(/\/$/, '').split('/')[0];
            } else if (cleanUrl.includes('/reel/')) {
                const parts = cleanUrl.split('/reel/');
                if (parts.length > 1) contentId = parts[1].replace(/\/$/, '').split('/')[0];
            }
        }

        if (contentId === targetShortcode) {
            console.log(`>>> FOUND TARGET ${targetShortcode} in API response!`);
            targetFound = true;
        }

        // Save logic (simplified)
        const publishedAt = item.publishedAt ? new Date(item.publishedAt.dateTime) : new Date();
        const caption = item.text || item.content || item.caption || '';
        const mediaUrl = item.imageUrl || item.thumbnailUrl || item.mediaUrl || '';
        
        // Metrics
        const views = item.views || item.videoViews || 0;
        const impression = item.impressionsTotal || item.impressions || 0;
        const reach = item.reach || 0;
        const like = item.likes || 0;
        const comment = item.comments || 0;
        const share = item.shares || 0;
        const saved = item.saves || 0;
        const repost = item.reposts || 0;

        const existing = await prisma.instagramContentSummary.findFirst({
            where: { project_id: projectId, content_id: contentId }
        });

        if (existing) {
            await prisma.instagramContentSummary.update({
                where: { id: existing.id },
                data: { views, impression, reach, like, comment, share, saved, repost, caption, media_url: mediaUrl }
            });
            // console.log(`Updated ${contentId}`);
        } else {
            await prisma.instagramContentSummary.create({
                data: {
                    project_id: projectId,
                    content_id: contentId,
                    type: 'post',
                    username: 'fdrtire', // hardcoded for now
                    caption,
                    media_url: mediaUrl,
                    published_at: publishedAt,
                    views, impression, reach, like, comment, share, saved, repost,
                    created_at: new Date()
                }
            });
            console.log(`Created ${contentId}`);
        }
    }

    if (!targetFound) {
        console.warn(`WARNING: Target ${targetShortcode} NOT found in API response.`);
    }

    // Also fetch Reels?
    console.log(`Fetching reels from ${from} to ${to}...`);
    const reels = await metricoolService.fetchAnalytics('instagram', 'reels', from, to, blogId, userId, userToken);
    console.log(`Fetched ${reels.length} reels.`);
    
    for (const item of reels) {
        // Similar logic for reels...
        let contentId = item.reelId || item.id;
        const url = item.url || item.permalink;
         if (url) {
            const cleanUrl = url.split('?')[0];
            if (cleanUrl.includes('/reel/')) {
                const parts = cleanUrl.split('/reel/');
                if (parts.length > 1) contentId = parts[1].replace(/\/$/, '').split('/')[0];
            }
        }
        
        if (contentId === targetShortcode) {
             console.log(`>>> FOUND TARGET ${targetShortcode} in REELS API response!`);
             targetFound = true;
        }
        
        // Save reel... (simplified)
         const publishedAt = item.publishedAt ? new Date(item.publishedAt.dateTime) : new Date();
         const caption = item.text || item.content || item.caption || '';
         const mediaUrl = item.imageUrl || item.thumbnailUrl || item.mediaUrl || '';
         
         const views = item.videoViews || item.views || 0;
         const impression = item.impressions || 0;
         const reach = item.reach || 0;
         const like = item.likes || 0;
         const comment = item.comments || 0;
         const share = item.shares || 0;
         const saved = item.saves || 0;
         
         const existing = await prisma.instagramContentSummary.findFirst({
            where: { project_id: projectId, content_id: contentId }
        });

        if (existing) {
            await prisma.instagramContentSummary.update({
                where: { id: existing.id },
                data: { views, impression, reach, like, comment, share, saved, caption, media_url: mediaUrl }
            });
        } else {
            await prisma.instagramContentSummary.create({
                data: {
                    project_id: projectId,
                    content_id: contentId,
                    type: 'reels',
                    username: 'fdrtire',
                    caption,
                    media_url: mediaUrl,
                    published_at: publishedAt,
                    views, impression, reach, like, comment, share, saved, repost: 0,
                    created_at: new Date()
                }
            });
            console.log(`Created Reel ${contentId}`);
        }
    }
};

run();
