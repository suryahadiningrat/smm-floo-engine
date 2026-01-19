const prisma = require('../utils/prisma');
const metricoolService = require('../services/metricoolService');
require('dotenv').config();

const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;

const dailyAggregation = async () => {
    console.log(`[Engine] Starting Daily Content Aggregation`);
    
    try {
        const projects = await prisma.project.findMany({
            where: {
                metricool_blog_id: { not: null },
                metricool_user_id: { not: null }
            }
        });

        // Calculate Yesterday
        const date = new Date();
        date.setDate(date.getDate() - 1);
        const yesterday = date.toISOString().split('T')[0];

        console.log(`[Engine] Aggregating data for date: ${yesterday}`);

        await Promise.all(projects.map(async (project) => {
            await processProjectDaily(project, yesterday);
        }));

        console.log(`[Engine] Daily Content Aggregation completed`);
    } catch (error) {
        console.error(`[Engine] Global error in dailyAggregation:`, error);
    }
};

const getShortcode = (url, originalId) => {
    if (!url) return originalId;
    try {
        const cleanUrl = url.split('?')[0];
        if (cleanUrl.includes('/p/')) {
            const parts = cleanUrl.split('/p/');
            if (parts.length > 1) return parts[1].replace(/\/$/, '').split('/')[0];
        }
        if (cleanUrl.includes('/reel/')) {
            const parts = cleanUrl.split('/reel/');
            if (parts.length > 1) return parts[1].replace(/\/$/, '').split('/')[0];
        }
        return originalId;
    } catch (e) {
        return originalId;
    }
};

const processProjectDaily = async (project, dateStr) => {
    const { id, metricool_blog_id, metricool_user_id } = project;
    const username = project.slug || project.name; 
    
    try {
        // Fetch Posts, Stories, Reels for yesterday
        const types = ['posts', 'stories', 'reels'];
        
        for (const type of types) {
            const items = await metricoolService.fetchAnalytics(
                'instagram', 
                type, 
                dateStr, 
                dateStr, 
                metricool_blog_id, 
                metricool_user_id, 
                USER_TOKEN
            );

            if (items && items.length > 0) {
                for (const item of items) {
                     // Map fields (reuse logic or keep simple)
                     let contentId = item.postId || item.id || item.permalink || item.reelId;
                     
                     // Try to extract shortcode from URL (permalink)
                     if (type === 'posts' || type === 'reels') { // Note: 'posts' plural here because types array is plural
                          contentId = getShortcode(item.url || item.permalink, contentId);
                     }

                     if (!contentId) {
                         console.warn(`[Engine] Skipping item with missing contentId. Keys: ${Object.keys(item).join(', ')}`);
                         continue;
                     }

                     const caption = item.text || item.content || item.caption || '';
                     const mediaUrl = item.imageUrl || item.thumbnailUrl || item.mediaUrl || item.url || '';
                     
                     // Metrics
                     const views = item.views || item.videoViews || 0;
                     const impression = item.impressionsTotal || item.impressions || 0;
                     const reach = item.reach || 0;
                     const like = item.likes || 0;
                     const comment = item.comments || 0;
                     const share = item.shares || 0;
                     const saved = item.saved || 0;
                     const repost = 0;
                     const publishedAt = item.publishedAt ? new Date(item.publishedAt.dateTime) : null;

                     // 1. Insert into metric.instagram_content (Daily Snapshot)
                     await prisma.instagramContent.create({
                        data: {
                            project_id: id,
                            username: username,
                            type: type === 'reels' ? 'reels' : type === 'stories' ? 'story' : 'post',
                            content_id: contentId,
                            caption,
                            media_url: mediaUrl,
                            views,
                            impression,
                            reach,
                            like,
                            comment,
                            share,
                            saved,
                            repost,
                            published_at: publishedAt,
                            created_at: new Date() // Snapshot time
                        }
                     });

                     // 2. Upsert into metric.instagram_content_summary (Latest State)
                     const existingSummary = await prisma.instagramContentSummary.findFirst({
                        where: { project_id: id, content_id: contentId }
                     });

                     if (existingSummary) {
                        await prisma.instagramContentSummary.update({
                            where: { id: existingSummary.id },
                            data: {
                                views, impression, reach, like, comment, share, saved, repost,
                                caption, media_url // Update content too if changed
                            }
                        });
                     } else {
                        await prisma.instagramContentSummary.create({
                            data: {
                                project_id: id,
                                username: username,
                                type: type === 'reels' ? 'reels' : type === 'stories' ? 'story' : 'post',
                                content_id: contentId,
                                caption,
                                media_url: mediaUrl,
                                views,
                                impression,
                                reach,
                                like,
                                comment,
                                share,
                                saved,
                                repost,
                                published_at: publishedAt
                            }
                        });
                     }
                }
                console.log(`[Engine] Saved ${items.length} ${type} for project ${id}`);
            }
        }

    } catch (error) {
        console.error(`[Engine] Error processing project ${id} daily:`, error.message);
    }
};

// If run directly
if (require.main === module) {
    dailyAggregation()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { dailyAggregation };
