const axios = require('axios');
const prisma = require('../utils/prisma');
require('dotenv').config();

const METRICOOL_API_BASE_URL = 'https://app.metricool.com/api/v2';
const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;
const BLOG_ID = process.env.METRICOOL_BLOG_ID;
const USER_ID = process.env.METRICOOL_USER_ID;

// Configurable Account Identifiers
const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME || 'fdrtire';

// Helper: Get Project
const getProject = async (reqProjectId) => {
    if (reqProjectId) {
        return await prisma.project.findUnique({ where: { id: parseInt(reqProjectId) } });
    }
    // Fallback to env vars for backward compatibility
    return await prisma.project.findFirst({
        where: {
            metricool_blog_id: BLOG_ID,
            metricool_user_id: USER_ID
        }
    });
};

// Helper: Format date to ISO (YYYY-MM-DD) with time
const formatToIsoDate = (dateStr, isEndOfDay = false) => {
    if (!dateStr) return null;
    if (dateStr.includes('T')) return dateStr; // Already ISO
    return isEndOfDay ? `${dateStr}T23:59:59` : `${dateStr}T00:00:00`;
};

// Helper: Fetch data from Metricool
// type: 'posts', 'stories', 'community' (future use)
const fetchMetricoolData = async (platform, type, from, to) => {
    try {
        const endpoint = `${METRICOOL_API_BASE_URL}/analytics/${type}/${platform}`;
        const params = {
            blogId: BLOG_ID,
            userId: USER_ID,
            from: formatToIsoDate(from),
            to: formatToIsoDate(to, true)
        };

        console.log(`[DEBUG] Fetching ${platform} ${type} from: ${endpoint}`);

        const response = await axios.get(endpoint, {
            params,
            headers: {
                'X-Mc-Auth': USER_TOKEN,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        return response.data.data || [];
    } catch (error) {
        console.warn(`[WARNING] Failed to fetch ${type} for ${platform}: ${error.message}`);
        if (error.response) {
            console.warn(`Status: ${error.response.status}`, error.response.data);
            if (error.response.status === 404 || error.response.status === 403) {
                return [];
            }
        }
        return [];
    }
};

const aiService = require('../services/aiService');

// --- Controllers ---

// Helper to get array of dates
const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    const currDate = new Date(startDate);
    const lastDate = new Date(endDate);
    
    while (currDate <= lastDate) {
        dates.push(new Date(currDate).toISOString().split('T')[0]);
        currDate.setDate(currDate.getDate() + 1);
    }
    return dates;
};

// Helper to format number
const formatNumber = (num) => Number((num || 0).toFixed(2));

// Generic helper for list endpoints
const getInstagramContentList = async (req, res, type, formatMapper) => {
    try {
        const { start_date, end_date, project_id } = req.query;

        if (!start_date || !end_date || !project_id) {
            return res.status(400).json({ error: 'start_date, end_date, and project_id are required' });
        }

        const projectIdInt = parseInt(project_id);

        const content = await prisma.instagramContent.findMany({
            where: {
                project_id: projectIdInt,
                type: type,
                published_at: {
                    gte: new Date(start_date + 'T00:00:00Z'),
                    lte: new Date(end_date + 'T23:59:59Z')
                }
            },
            orderBy: { published_at: 'desc' }
        });

        const formatted = content.map((item, index) => formatMapper(item, index + 1));

        res.json(formatted);

    } catch (error) {
        console.error(`Get Instagram ${type} Error:`, error);
        res.status(500).json({ error: `Failed to fetch instagram ${type}` });
    }
};

exports.getInstagramPosts = (req, res) => {
    getInstagramContentList(req, res, 'post', (item, autoIncrementId) => ({
        id: item.content_id,
        media_url: item.media_url,
        caption: item.caption,
        date: item.published_at ? item.published_at.toISOString().split('T')[0] : null,
        views: (item.views || 0) + (item.impression || 0), // "views (total views)" -> combining implies total exposure? User logic.
        impression: item.impression || 0,
        reach: item.reach || 0,
        like: item.like || 0,
        share: item.share || 0,
        comment: item.comment || 0,
        interaction: (item.like || 0) + (item.comment || 0) + (item.share || 0)
    }));
};

exports.getInstagramReels = (req, res) => {
    getInstagramContentList(req, res, 'reels', (item, autoIncrementId) => ({
        id: item.content_id,
        media_url: item.media_url,
        caption: item.caption,
        date: item.published_at ? item.published_at.toISOString().split('T')[0] : null,
        views: item.views || 0,
        reach: item.reach || 0,
        like: item.like || 0,
        share: item.share || 0,
        comment: item.comment || 0,
        interaction: (item.like || 0) + (item.comment || 0) + (item.share || 0),
        reposts: item.repost || 0
    }));
};

exports.getInstagramStories = (req, res) => {
    getInstagramContentList(req, res, 'story', (item, autoIncrementId) => ({
        id: item.content_id,
        media_url: item.media_url,
        impressions: (item.impression || 0) + (item.views || 0), // "impressions (total views)" -> Stories use impressions usually.
        reach: item.reach || 0
    }));
};

exports.getInstagramMetrics = async (req, res) => {
    try {
        const { start_date, end_date, project_id } = req.query;

        if (!start_date || !end_date || !project_id) {
            return res.status(400).json({ error: 'start_date, end_date, and project_id are required' });
        }

        const projectIdInt = parseInt(project_id);
        const dateRangeKey = `${start_date} - ${end_date}`;
        const dates = getDatesInRange(start_date, end_date);
        const daysCount = dates.length;

        // Fetch Data
        // 1. Account History (Community)
        // We fetch all records in range to map them to days
        const accountHistory = await prisma.instagramAccount.findMany({
            where: {
                project_id: projectIdInt,
                created_at: {
                    gte: new Date(start_date + 'T00:00:00Z'),
                    lte: new Date(end_date + 'T23:59:59Z')
                }
            },
            orderBy: { created_at: 'asc' }
        });

        // 2. Content (Posts, Reels, Stories)
        const contentHistory = await prisma.instagramContent.findMany({
            where: {
                project_id: projectIdInt,
                published_at: {
                    gte: new Date(start_date + 'T00:00:00Z'),
                    lte: new Date(end_date + 'T23:59:59Z')
                }
            }
        });

        // Prepare Daily Details
        const details = {
            community: [],
            account: [],
            posts: [],
            reels: [],
            stories: []
        };

        // Aggregators for Summary
        const summaryAgg = {
            community: {
                followers_start: 0,
                followers_end: 0,
                following_end: 0,
                total_posts: 0,
                total_reels: 0,
                total_stories: 0
            },
            posts: {
                views: 0, likes: 0, comments: 0, shares: 0, reposts: 0, reach_sum: 0, engagement_sum: 0, count: 0
            },
            reels: {
                views: 0, likes: 0, comments: 0, shares: 0, reposts: 0, reach_sum: 0, engagement_sum: 0, count: 0
            },
            stories: {
                impressions: 0, reach_sum: 0, count: 0
            }
        };

        // Map Account History by Date (Take last record of each day)
        const accountMap = {};
        accountHistory.forEach(record => {
            const date = record.created_at.toISOString().split('T')[0];
            accountMap[date] = record; // Overwrites with latest
        });

        // Set start/end followers for summary
        // Find closest available data for start and end
        // Simple approach: use the map
        const sortedDatesWithData = Object.keys(accountMap).sort();
        if (sortedDatesWithData.length > 0) {
            summaryAgg.community.followers_start = accountMap[sortedDatesWithData[0]].followers;
            summaryAgg.community.followers_end = accountMap[sortedDatesWithData[sortedDatesWithData.length - 1]].followers;
            summaryAgg.community.following_end = accountMap[sortedDatesWithData[sortedDatesWithData.length - 1]].following;
        }

        // Process Each Day
        dates.forEach(date => {
            // Community & Account
            const acc = accountMap[date] || { followers: 0, following: 0, posts: 0 };
            
            // Filter Content for this day
            const dayContent = contentHistory.filter(c => c.published_at && c.published_at.toISOString().split('T')[0] === date);
            
            const posts = dayContent.filter(c => c.type === 'post');
            const reels = dayContent.filter(c => c.type === 'reels');
            const stories = dayContent.filter(c => c.type === 'story');

            // --- Details: Community ---
            details.community.push({
                date,
                followers: acc.followers,
                following: acc.following,
                posts: posts.length,
                reels: reels.length,
                stories: stories.length
            });

            // Update Summary Counts
            summaryAgg.community.total_posts += posts.length;
            summaryAgg.community.total_reels += reels.length;
            summaryAgg.community.total_stories += stories.length;

            // --- Details: Posts ---
            const postMetrics = posts.reduce((acc, curr) => ({
                views: acc.views + (curr.views || 0) + (curr.impression || 0), // Post usually uses impression as views
                reach: acc.reach + (curr.reach || 0),
                likes: acc.likes + (curr.like || 0),
                comments: acc.comments + (curr.comment || 0),
                shares: acc.shares + (curr.share || 0),
                reposts: acc.reposts + (curr.repost || 0)
            }), { views: 0, reach: 0, likes: 0, comments: 0, shares: 0, reposts: 0 });

            const postInteraction = postMetrics.likes + postMetrics.comments + postMetrics.shares + postMetrics.reposts;
            const postAvgReach = posts.length ? postMetrics.reach / posts.length : 0;
            const postEngagement = posts.length ? postMetrics.likes / posts.length : 0; // "engagement -> avg like per post" per user req

            details.posts.push({
                date,
                summary: {
                    views: postMetrics.views,
                    avg_reach_per_post: formatNumber(postAvgReach),
                    interaction: postInteraction,
                    engagement: formatNumber(postEngagement)
                },
                interactions: {
                    likes: postMetrics.likes,
                    comments: postMetrics.comments,
                    shares: postMetrics.shares
                }
            });

            // Update Summary Posts
            summaryAgg.posts.views += postMetrics.views;
            summaryAgg.posts.likes += postMetrics.likes;
            summaryAgg.posts.comments += postMetrics.comments;
            summaryAgg.posts.shares += postMetrics.shares;
            summaryAgg.posts.reposts += postMetrics.reposts;
            summaryAgg.posts.reach_sum += postAvgReach; // Sum of daily averages? No, user says "sum avg_rech_per_posts per daily / how many day"
            summaryAgg.posts.engagement_sum += postEngagement; // Same logic
            summaryAgg.posts.count += posts.length;

            // --- Details: Reels ---
            const reelMetrics = reels.reduce((acc, curr) => ({
                views: acc.views + (curr.views || 0),
                reach: acc.reach + (curr.reach || 0),
                likes: acc.likes + (curr.like || 0),
                comments: acc.comments + (curr.comment || 0),
                shares: acc.shares + (curr.share || 0),
                reposts: acc.reposts + (curr.repost || 0)
            }), { views: 0, reach: 0, likes: 0, comments: 0, shares: 0, reposts: 0 });

            const reelInteraction = reelMetrics.likes + reelMetrics.comments + reelMetrics.shares + reelMetrics.reposts;
            const reelAvgReach = reels.length ? reelMetrics.reach / reels.length : 0;
            const reelEngagement = reels.length ? reelMetrics.likes / reels.length : 0;

            details.reels.push({
                date,
                summary: {
                    views: reelMetrics.views,
                    avg_reach_per_reel: formatNumber(reelAvgReach),
                    interaction: reelInteraction,
                    engagement: formatNumber(reelEngagement)
                },
                interactions: {
                    likes: reelMetrics.likes,
                    comments: reelMetrics.comments,
                    shares: reelMetrics.shares
                }
            });

            // Update Summary Reels
            summaryAgg.reels.views += reelMetrics.views;
            summaryAgg.reels.likes += reelMetrics.likes;
            summaryAgg.reels.comments += reelMetrics.comments;
            summaryAgg.reels.shares += reelMetrics.shares;
            summaryAgg.reels.reposts += reelMetrics.reposts;
            summaryAgg.reels.reach_sum += reelAvgReach;
            summaryAgg.reels.engagement_sum += reelEngagement;
            summaryAgg.reels.count += reels.length;

            // --- Details: Stories ---
            const storyMetrics = stories.reduce((acc, curr) => ({
                impressions: acc.impressions + (curr.impression || 0) + (curr.views || 0),
                reach: acc.reach + (curr.reach || 0)
            }), { impressions: 0, reach: 0 });

            const storyAvgReach = stories.length ? storyMetrics.reach / stories.length : 0;

            details.stories.push({
                date,
                impressions: storyMetrics.impressions,
                avg_reach_per_stories: formatNumber(storyAvgReach),
                stories: stories.length
            });

            // Update Summary Stories
            summaryAgg.stories.impressions += storyMetrics.impressions;
            summaryAgg.stories.reach_sum += storyAvgReach; // Note: user logic check
            summaryAgg.stories.count += stories.length;

            // --- Details: Account (Aggregated views of all content types) ---
            const totalViews = postMetrics.views + reelMetrics.views + storyMetrics.impressions;
            // "avg_reach_per_day" -> User says "avg reach per day". 
            // This implies Sum(reach of all content today) / count? Or just Sum?
            // "avg reach per day" usually means Average Reach of the Account per Day.
            // But here we are inside "Per Day". So it's just "Reach Today".
            // Unless it means Average Reach Per Post Today?
            // Let's assume it's Total Reach Today for now, or Average if multiple posts.
            // User: "avg_reach_per_day". I'll use (Total Reach / Total Content Count) or just Total Reach.
            // Given "avg", likely / count.
            const totalContentToday = posts.length + reels.length + stories.length;
            const totalReachToday = postMetrics.reach + reelMetrics.reach + storyMetrics.reach;
            const avgReachToday = totalContentToday ? totalReachToday / totalContentToday : 0;

            details.account.push({
                date,
                views: totalViews,
                avg_reach_per_day: formatNumber(avgReachToday)
            });
        });

        // Construct Summary
        const totalFollowerGrowth = summaryAgg.community.followers_end - summaryAgg.community.followers_start;
        const totalContentCount = summaryAgg.community.total_posts + summaryAgg.community.total_reels + summaryAgg.community.total_stories;
        
        // "posts_per_week" -> total content / (days / 7)
        const weeks = daysCount / 7;
        const postsPerWeek = weeks > 0 ? totalContentCount / weeks : 0;

        const summary = {
            community: {
                total_followers: summaryAgg.community.followers_end,
                following: summaryAgg.community.following_end,
                total_content: {
                    posts: summaryAgg.community.total_posts,
                    reels: summaryAgg.community.total_reels,
                    stories: summaryAgg.community.total_stories
                },
                followers: totalFollowerGrowth,
                daily_followers: formatNumber(totalFollowerGrowth / daysCount),
                daily_posts: formatNumber(totalContentCount / daysCount),
                posts_per_week: formatNumber(postsPerWeek)
            },
            posts: {
                summary: {
                    engagement: formatNumber(summaryAgg.posts.engagement_sum / daysCount),
                    interaction: summaryAgg.posts.likes + summaryAgg.posts.comments + summaryAgg.posts.shares + summaryAgg.posts.reposts, // "total interaction of posts"
                    avg_reach_per_posts: formatNumber(summaryAgg.posts.reach_sum / daysCount),
                    views: summaryAgg.posts.views,
                    posts: summaryAgg.posts.count
                },
                interactions: { // Typo in user prompt "intereactions", fixed to "interactions"
                    likes: summaryAgg.posts.likes,
                    comments: summaryAgg.posts.comments,
                    shares: summaryAgg.posts.shares,
                    posts: summaryAgg.posts.count,
                    daily_likes: formatNumber(summaryAgg.posts.likes / daysCount),
                    daily_comments: formatNumber(summaryAgg.posts.comments / daysCount)
                }
            },
            reels: {
                summary: {
                    engagement: formatNumber(summaryAgg.reels.engagement_sum / daysCount),
                    interaction: summaryAgg.reels.likes + summaryAgg.reels.comments + summaryAgg.reels.shares + summaryAgg.reels.reposts,
                    avg_reach_per_reels: formatNumber(summaryAgg.reels.reach_sum / daysCount),
                    views: summaryAgg.reels.views,
                    reels: summaryAgg.reels.count
                },
                interactions: {
                    likes: summaryAgg.reels.likes,
                    comments: summaryAgg.reels.comments,
                    shares: summaryAgg.reels.shares,
                    reels: summaryAgg.reels.count,
                    daily_likes: formatNumber(summaryAgg.reels.likes / daysCount),
                    daily_comments: formatNumber(summaryAgg.reels.comments / daysCount)
                }
            },
            stories: {
                impressions: summaryAgg.stories.impressions,
                stories: summaryAgg.stories.count
            }
        };

        const response = {
            [dateRangeKey]: {
                details,
                summary
            }
        };

        res.json(response);

    } catch (error) {
        console.error('Metrics Error:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
};

exports.analyzeInstagramComments = async (req, res) => {
    try {
        const { post_id, keyword } = req.body;
        const projectId = req.body.project_id || 1; // Default to 1 if not provided, or handle auth

        if (!post_id || !keyword) {
            return res.status(400).json({ error: 'post_id and keyword are required' });
        }

        // 1. Fetch Post Content (for Caption context)
        // Check Summary first (latest)
        let post = await prisma.instagramContentSummary.findFirst({
            where: { content_id: post_id }
        });

        // If not in summary, check history
        if (!post) {
            post = await prisma.instagramContent.findFirst({
                where: { content_id: post_id }
            });
        }

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // 2. Fetch Comments
        const comments = await prisma.instagramComment.findMany({
            where: { content_id: post_id },
            orderBy: { created_at: 'desc' },
            take: 100 // Limit to 100 for AI analysis to respect token limits/speed
        });

        if (comments.length === 0) {
            return res.json({
                positive_sentiment: 0,
                negative_sentiment: 0,
                neutral_sentiment: 0,
                relate_comment: 0,
                keyword_related_comment: 0,
                detail: {
                    positive_sentiments: [],
                    negative_sentiments: [],
                    neutral_sentiments: [],
                    relate_comments: []
                }
            });
        }

        // 3. AI Analysis
        // Map to simple structure for AI
        const commentsForAi = comments.map(c => ({
            username: c.commenters_username,
            text: c.text
        }));

        const analysisResult = await aiService.analyzeSentiment(post.caption || '', keyword, commentsForAi);
        
        // 4. Aggregation
        const results = analysisResult.results || [];
        const total = results.length;

        if (total === 0) {
             return res.json({
                positive_sentiment: 0,
                negative_sentiment: 0,
                neutral_sentiment: 0,
                relate_comment: 0,
                keyword_related_comment: 0,
                detail: {
                    positive_sentiments: [],
                    negative_sentiments: [],
                    neutral_sentiments: [],
                    relate_comments: []
                }
            });
        }

        let positiveCount = 0;
        let negativeCount = 0;
        let neutralCount = 0;
        let relatedPostCount = 0;
        let relatedKeywordCount = 0;

        const detail = {
            positive_sentiments: [],
            negative_sentiments: [],
            neutral_sentiments: [],
            relate_comments: []
        };

        results.forEach((r) => {
            // Use r.index to map back to original comment to ensure accuracy even if batches fail
            const originalIndex = typeof r.index === 'number' ? r.index : -1;
            
            // Skip if index is invalid or out of bounds
            if (originalIndex < 0 || originalIndex >= comments.length) {
                return; 
            }

            const originalComment = comments[originalIndex]; 
            const commentObj = {
                username: originalComment?.commenters_username || 'unknown',
                text: originalComment?.text || '',
                sentiment: r.sentiment
            };

            // Sentiment
            if (r.sentiment === 'positive') {
                positiveCount++;
                detail.positive_sentiments.push(commentObj);
            } else if (r.sentiment === 'negative') {
                negativeCount++;
                detail.negative_sentiments.push(commentObj);
            } else {
                neutralCount++;
                detail.neutral_sentiments.push(commentObj);
            }

            // Relations
            if (r.is_related_to_post) {
                relatedPostCount++;
                detail.relate_comments.push(commentObj);
            }
            if (r.is_related_to_keyword) {
                relatedKeywordCount++;
            }
        });

        const calculatePercentage = (count) => total === 0 ? 0 : parseFloat(((count / total) * 100).toFixed(2));

        const responsePayload = {
            positive_sentiment: calculatePercentage(positiveCount),
            negative_sentiment: calculatePercentage(negativeCount),
            neutral_sentiment: calculatePercentage(neutralCount),
            relate_comment: calculatePercentage(relatedPostCount),
            keyword_related_comment: calculatePercentage(relatedKeywordCount),
            detail: detail
        };

        res.json(responsePayload);

    } catch (error) {
        console.error('Analysis Error:', error);
        res.status(500).json({ error: 'Failed to analyze comments' });
    }
};

exports.getInstagramCommunity = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'start_date and end_date are required' });
        }
        // Direct fetch as no DB table exists for community
        const community = await fetchMetricoolData('instagram', 'community', start_date, end_date);
        res.json({ success: true, data: community });
    } catch (error) {
         res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

exports.getInstagramAccount = async (req, res) => {
    try {
        const { start_date, end_date, project_id } = req.query;
        if (!start_date || !end_date || !project_id) {
            return res.status(400).json({ error: 'start_date, end_date, and project_id are required' });
        }
        
        const project = await getProject(project_id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const fromDate = new Date(start_date); fromDate.setHours(0,0,0,0);
        const toDate = new Date(end_date); toDate.setHours(23,59,59,999);

        // 1. Account Growth (Followers, Following)
        const endAccount = await prisma.instagramAccount.findFirst({
            where: {
                project_id: project.id,
                created_at: { lte: toDate }
            },
            orderBy: { created_at: 'desc' }
        });

        const startAccount = await prisma.instagramAccount.findFirst({
            where: {
                project_id: project.id,
                created_at: { gte: fromDate }
            },
            orderBy: { created_at: 'asc' }
        });

        const followersEnd = endAccount ? endAccount.followers : 0;
        const followersStart = startAccount ? startAccount.followers : 0;
        const netFollowerChange = followersEnd - followersStart;
        const totalFollowing = endAccount ? endAccount.following : 0;

        // 2. Aggregate Content Metrics (Feed: Posts + Reels)
        const feedStats = await prisma.instagramContentSummary.aggregate({
             where: {
                project_id: project.id,
                type: { in: ['post', 'reels'] },
                published_at: { gte: fromDate, lte: toDate }
            },
            _sum: {
                like: true,
                comment: true,
                share: true,
                views: true,
                impression: true,
                repost: true
            }
        });

        // 3. Separate counts for types
        const typeCounts = await prisma.instagramContentSummary.groupBy({
            by: ['type'],
            where: {
                project_id: project.id,
                published_at: { gte: fromDate, lte: toDate }
            },
            _count: { id: true }
        });
        const getCount = (t) => typeCounts.find(x => x.type === t)?._count.id || 0;

        // 4. Story stats
        const storyStats = await prisma.instagramContentSummary.aggregate({
             where: {
                project_id: project.id,
                type: 'story',
                published_at: { gte: fromDate, lte: toDate }
            },
            _sum: { impression: true }
        });

        const formattedData = {
            platform: 'Instagram',
            period: { start_date, end_date },
            account_performance: {
                total_followers: followersEnd,
                total_following: totalFollowing,
                total_unfollow: netFollowerChange < 0 ? Math.abs(netFollowerChange) : 0,
                net_follower_change: netFollowerChange,
                total_page_view: 0, 
                total_post: getCount('post'),
                total_reels: getCount('reels'),
                total_story: getCount('story')
            },
            post_performance: {
                total_likes: feedStats._sum.like || 0,
                total_comment: feedStats._sum.comment || 0,
                total_share: feedStats._sum.share || 0,
                total_view: (feedStats._sum.views || 0) + (feedStats._sum.impression || 0),
                total_save: feedStats._sum.repost || 0
            },
            story_performance: {
                total_story_view: storyStats._sum.impression || 0
            }
        };

        res.json({ success: true, data: formattedData });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

exports.getInstagramAnalytics = exports.getInstagramAccount;
