const prisma = require('../utils/prisma');
const metricoolService = require('../services/metricoolService');
require('dotenv').config();

const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;

// Helper to chunk date ranges (e.g., monthly)
const getMonthRanges = (startDate, endDate) => {
    const ranges = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current < end) {
        const nextMonth = new Date(current);
        nextMonth.setMonth(current.getMonth() + 1);
        
        let rangeEnd = nextMonth < end ? nextMonth : end;
        ranges.push({
            from: current.toISOString().split('T')[0],
            to: rangeEnd.toISOString().split('T')[0]
        });
        current = nextMonth;
    }
    return ranges;
};

const syncProject = async (projectId, forceStartDate = null) => {
    console.log(`[Engine] Starting initial sync for project ${projectId}`);
    
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project || !project.metricool_blog_id || !project.metricool_user_id) {
            console.error(`[Engine] Project ${projectId} missing credentials`);
            return;
        }

        const { metricool_blog_id, metricool_user_id } = project;
        const username = project.slug || project.name;

        // Determine date range for CONTENT: Fetch last 10 years for "full history"
        const endDate = new Date();
        const startDate = forceStartDate ? new Date(forceStartDate) : new Date();
        if (!forceStartDate) {
            startDate.setFullYear(startDate.getFullYear() - 10); // 10 years back
        }

        const ranges = getMonthRanges(startDate, endDate);
        
        // Track earliest date for account growth backfill
        let earliestContentDate = new Date();

        // Process Instagram Content
        for (const range of ranges) {
            console.log(`[Engine] Syncing Instagram Content for range: ${range.from} - ${range.to}`);
            
            // 1. Posts
            try {
                const posts = await metricoolService.fetchAnalytics('instagram', 'posts', range.from, range.to, metricool_blog_id, metricool_user_id, USER_TOKEN);
                const minDatePost = await saveInstagramContent(project.id, posts, 'post', username, metricool_blog_id, metricool_user_id);
                if (minDatePost && minDatePost < earliestContentDate) earliestContentDate = minDatePost;
            } catch (err) {
                console.error(`[Engine] Failed to fetch posts for ${range.from}: ${err.message}`);
            }
            
            // 2. Reels
            try {
                const reels = await metricoolService.fetchAnalytics('instagram', 'reels', range.from, range.to, metricool_blog_id, metricool_user_id, USER_TOKEN);
                const minDateReel = await saveInstagramContent(project.id, reels, 'reels', username, metricool_blog_id, metricool_user_id);
                if (minDateReel && minDateReel < earliestContentDate) earliestContentDate = minDateReel;
            } catch (err) {
                 console.error(`[Engine] Failed to fetch reels for ${range.from}: ${err.message}`);
            }

            // 3. Stories
            try {
                const stories = await metricoolService.fetchAnalytics('instagram', 'stories', range.from, range.to, metricool_blog_id, metricool_user_id, USER_TOKEN);
                const minDateStory = await saveInstagramContent(project.id, stories, 'story', username, metricool_blog_id, metricool_user_id);
                if (minDateStory && minDateStory < earliestContentDate) earliestContentDate = minDateStory;
            } catch (err) {
                console.error(`[Engine] Failed to fetch stories for ${range.from}: ${err.message}`);
            }
        }

        // Pre-fetch all content dates for efficient post counting
        const allContent = await prisma.instagramContentSummary.findMany({
            where: { project_id: projectId },
            select: { published_at: true, type: true }
        });

        // Sync Comments (Global Inbox Fetch)
        await syncComments(projectId, metricool_blog_id, metricool_user_id, USER_TOKEN);

        // Helper to count posts/reels up to a date
        const countPostsUpTo = (date) => {
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            // Count POSTS and REELS
            return allContent.filter(c => c.published_at && c.published_at <= endOfDay && (c.type === 'post' || c.type === 'reels')).length;
        };

        // Process Instagram Account Growth (Historical Backfill)
        const startBackfillDate = forceStartDate ? new Date(forceStartDate) : earliestContentDate;
        console.log(`[Engine] Starting Account Growth Backfill from ${startBackfillDate.toISOString().split('T')[0]}`);
        
        let currentDate = new Date(startBackfillDate);
        const todayDate = new Date();
        let latestAccountData = null;
        let currentMonthStart = new Date(currentDate);
        let lastKnownFollowing = 0; 

        while (currentMonthStart <= todayDate) {
            const currentMonthEnd = new Date(currentMonthStart);
            currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
            currentMonthEnd.setDate(0); 
            
            if (currentMonthEnd > todayDate) {
                currentMonthEnd.setTime(todayDate.getTime());
            }

            const fromStr = currentMonthStart.toISOString().split('T')[0];
            const toStr = currentMonthEnd.toISOString().split('T')[0];

            console.log(`[Engine] Fetching Competitors History: ${fromStr} to ${toStr}`);

            try {
                // Fetch range
                const rangeData = await metricoolService.fetchCompetitors(
                    'instagram', 
                    fromStr, 
                    toStr, 
                    metricool_blog_id, 
                    metricool_user_id, 
                    USER_TOKEN
                );

                let dayCursor = new Date(currentMonthStart);
                while (dayCursor <= currentMonthEnd) {
                    const dateStr = dayCursor.toISOString().split('T')[0];
                    
                    // Single Day Request
                    const dailyDataRaw = await metricoolService.fetchCompetitors(
                        'instagram',
                        dateStr,
                        dateStr,
                        metricool_blog_id,
                        metricool_user_id,
                        USER_TOKEN
                    );
                    
                    const myAccount = dailyDataRaw.find(c => c.screenName === username || c.username === username || (c.providerId && c.providerId === username));

                    if (myAccount) {
                        const LAG_DAYS = 2;
                        const actualDataDate = new Date(dayCursor);
                        actualDataDate.setDate(actualDataDate.getDate() - LAG_DAYS);
                        const actualDateStr = actualDataDate.toISOString().split('T')[0];

                        const totalPosts = countPostsUpTo(actualDataDate); 
                        
                        let currentFollowing = myAccount.following;
                        if (currentFollowing === null || currentFollowing === undefined) {
                            currentFollowing = lastKnownFollowing;
                        } else {
                            lastKnownFollowing = currentFollowing;
                        }

                        if (myAccount.followers > 0) {
                            latestAccountData = {
                                posts: totalPosts,
                                followers: myAccount.followers || 0,
                                following: currentFollowing
                            };

                            const startOfDay = new Date(actualDateStr);
                            startOfDay.setHours(0,0,0,0);
                            const endOfDay = new Date(actualDateStr);
                            endOfDay.setHours(23,59,59,999);

                            const existingHistory = await prisma.instagramAccount.findFirst({
                                where: {
                                    project_id: projectId,
                                    created_at: { gte: startOfDay, lte: endOfDay }
                                }
                            });

                            if (existingHistory) {
                                await prisma.instagramAccount.update({
                                    where: { id: existingHistory.id },
                                    data: {
                                        posts: totalPosts,
                                        followers: myAccount.followers || 0,
                                        following: currentFollowing,
                                        created_at: new Date(actualDateStr + 'T12:00:00') 
                                    }
                                });
                            } else {
                                await prisma.instagramAccount.create({
                                    data: {
                                        project_id: projectId,
                                        username: username,
                                        posts: totalPosts,
                                        followers: myAccount.followers || 0,
                                        following: currentFollowing,
                                        created_at: new Date(actualDateStr + 'T12:00:00')
                                    }
                                });
                            }
                        }
                    }

                    dayCursor.setDate(dayCursor.getDate() + 1);
                }

            } catch (err) {
                console.warn(`[Engine] Failed to sync account history for month ${fromStr}: ${err.message}`);
            }

            currentMonthStart.setMonth(currentMonthStart.getMonth() + 1);
            currentMonthStart.setDate(1); 
        }

        if (latestAccountData) {
            const summaryExists = await prisma.platformAccountSummary.findFirst({
                where: { project_id: projectId, platform: 'instagram' }
            });

            const summaryData = {
                project_id: projectId,
                username: username,
                platform: 'instagram',
                posts: latestAccountData.posts || 0,
                followers: latestAccountData.followers || 0,
                following: latestAccountData.following || 0
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
            console.log(`[Engine] Updated Platform Account Summary for project ${projectId}`);
        }

        console.log(`[Engine] Initial sync completed for project ${projectId}`);

    } catch (error) {
        console.error(`[Engine] Error syncing project ${projectId}:`, error);
    }
};

const syncComments = async (projectId, blogId, userId, userToken) => {
    console.log(`[Engine] Syncing comments for project ${projectId} using Post Comments API`);
    try {
        // Fetch project to get default username
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { slug: true, name: true }
        });
        const projectUsername = project ? (project.slug || project.name) : 'unknown';

        const LIMIT = 100;
        let offset = 0;
        let hasMore = true;
        let totalSaved = 0;
        let pages = 0;
        const MAX_PAGES = 500; // Increased limit to fetch deeper history

        while (hasMore && pages < MAX_PAGES) {
            console.log(`[Engine] Fetching post comments page ${pages + 1} (offset: ${offset})...`);
            
            const items = await metricoolService.fetchPostComments(blogId, userId, userToken, { 
                limit: LIMIT,
                offset: offset
            });
            
            if (!items || items.length === 0) {
                console.log('[Engine] No more comments found.');
                hasMore = false;
                break;
            }

            console.log(`[Engine] Processing ${items.length} comment threads...`);
            
            for (const item of items) {
                const root = item.root;
                if (!root || !root.element) continue;

                const element = root.element;
                const postLink = element.link;
                
                // Extract shortcode from link (https://www.instagram.com/p/SHORTCODE/ or /reel/SHORTCODE/)
                let shortcode = null;
                if (postLink) {
                    if (postLink.includes('/p/')) {
                        // Handle query params like ?img_index=1 or / at the end
                        shortcode = postLink.split('/p/')[1].split('/')[0].split('?')[0];
                    } else if (postLink.includes('/reel/')) {
                        // Handle reels
                        shortcode = postLink.split('/reel/')[1].split('/')[0].split('?')[0];
                    }
                }

                if (!shortcode) continue;

                // Find content in DB (Check Summary first, then raw Content)
                let content = await prisma.instagramContentSummary.findFirst({
                    where: { 
                        project_id: projectId,
                        content_id: shortcode 
                    }
                });

                if (!content) {
                    // Fallback: Check if it exists in raw history
                    const rawContent = await prisma.instagramContent.findFirst({
                        where: {
                            project_id: projectId,
                            content_id: shortcode
                        }
                    });
                    if (rawContent) {
                        content = rawContent; // Use raw content for ID reference
                    }
                }

                // If STILL not found, CREATE IT from the comment's parent info
                if (!content) {
                    // Map type
                    let type = 'post';
                    const productType = element.properties?.igMediaProductType;
                    if (productType === 'REELS') type = 'reels';
                    if (productType === 'STORY') type = 'story';
                    
                    // Fallback published_at (Use comment creation date as proxy if needed)
                    // Note: root.creationDate is the comment date, but it's the best we have if post is missing
                    const publishedAt = root.creationDate ? new Date(root.creationDate) : new Date();

                    try {
                        content = await prisma.instagramContentSummary.create({
                            data: {
                                project_id: projectId,
                                content_id: shortcode,
                                type: type,
                                username: projectUsername,
                                caption: element.text || '',
                                media_url: (element.mediaUrls && element.mediaUrls.length > 0) ? element.mediaUrls[0] : null,
                                published_at: publishedAt,
                                views: 0,
                                impression: 0,
                                reach: 0,
                                like: 0,
                                comment: element.commentCount || 0,
                                share: 0,
                                saved: 0,
                                repost: 0
                                // created_at: new Date() // Removed as not in schema
                            }
                        });
                        console.log(`[Engine] Created missing content summary for ${shortcode}`);
                    } catch (err) {
                        console.warn(`[Engine] Failed to create missing content for ${shortcode}: ${err.message}`);
                    }
                }

                if (content) {
                    // Prepare data
                    const commenter = root.owner;
                    const text = root.text || '';
                    const createdAt = root.creationDate ? new Date(root.creationDate) : new Date();
                    const replyCount = root.comments ? root.comments.length : 0;
                    
                    // Deduplication check
                    const existing = await prisma.instagramComment.findFirst({
                        where: {
                            project_id: projectId,
                            content_id: content.content_id,
                            commenters_username: commenter,
                            text: text,
                            created_at: createdAt
                        }
                    });

                    if (!existing) {
                        await prisma.instagramComment.create({
                            data: {
                                project_id: projectId,
                                content_id: content.content_id,
                                commenters_username: commenter,
                                text: text,
                                comments_like: 0, // Not available in API response
                                comments_count: replyCount,
                                created_at: createdAt
                            }
                        });
                        totalSaved++;
                    }
                }
            }
            
            offset += LIMIT;
            pages++;
        }
        
        console.log(`[Engine] Total new comments saved: ${totalSaved}`);

    } catch (error) {
        console.error(`[Engine] Error syncing comments for project ${projectId}:`, error);
    }
};

const saveInstagramContent = async (projectId, items, type, usernameFallback, blogId, userId) => {
    if (!items || items.length === 0) return null;

    let minDate = null;

    // Helper to extract shortcode from URL
    const getShortcode = (url, originalId) => {
        if (!url) return originalId;
        try {
            // Remove query params
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

    for (const item of items) {
        // Map fields
        // Use shortcode for Posts/Reels if available in URL
        let contentId = item.postId || item.id || item.reelId || item.contentId;
        
        // Try to extract shortcode from URL (permalink)
        if (type === 'post' || type === 'reels') {
             contentId = getShortcode(item.url || item.permalink, contentId);
        }

        if (!contentId) {
            console.warn(`[Engine] Skipping item with missing contentId. Keys: ${Object.keys(item).join(', ')}`);
            continue;
        }

        const caption = item.text || item.content || item.caption || '';
        const mediaUrl = item.imageUrl || item.thumbnailUrl || item.mediaUrl || '';
        const publishedAt = item.publishedAt ? new Date(item.publishedAt.dateTime) : new Date();

        // Track min date
        if (!minDate || publishedAt < minDate) {
            minDate = publishedAt;
        }

        // Metrics
        const views = item.views || item.videoViews || 0;
        const impression = item.impressionsTotal || item.impressions || 0;
        const reach = item.reach || 0;
        const like = item.likes || 0;
        const comment = item.comments || 0;
        const share = item.shares || 0;
        const saved = item.saves || 0;
        const repost = item.reposts || 0;

        // Upsert Content Summary
        const existingContent = await prisma.instagramContentSummary.findFirst({
            where: { project_id: projectId, content_id: contentId }
        });

        if (existingContent) {
            await prisma.instagramContentSummary.update({
                where: { id: existingContent.id },
                data: {
                    views, impression, reach, like, comment, share, saved, repost,
                    caption, media_url: mediaUrl
                }
            });
        } else {
            await prisma.instagramContentSummary.create({
                data: {
                    project_id: projectId,
                    content_id: contentId,
                    type,
                    username: usernameFallback, // Can we get from item?
                    caption,
                    media_url: mediaUrl,
                    published_at: publishedAt,
                    views, impression, reach, like, comment, share, saved, repost,
                    created_at: new Date()
                }
            });
        }

        // Trigger Comment Sync for this post if it has comments (Placeholder)
        // We now do global comment sync, so this is less critical, but could still be useful for direct fetch if endpoint existed.
        if (comment > 0) {
             await metricoolService.fetchComments('instagram', contentId, blogId, userId, USER_TOKEN);
        }
    }

    return minDate;
};

module.exports = {
    syncProject,
    syncComments
};