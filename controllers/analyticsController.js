const axios = require('axios');
require('dotenv').config();

const METRICOOL_API_BASE_URL = 'https://app.metricool.com/api/v2'; // Base URL Asumsi
const USER_TOKEN = process.env.METRICOOL_USER_TOKEN;
const BLOG_ID = process.env.METRICOOL_BLOG_ID;

// Helper untuk validasi tanggal
const validateDates = (from, to) => {
    if (!from || !to) {
        throw new Error('Parameters "from" and "to" are required.');
    }
};

// Helper untuk fetch data dari Metricool
const fetchMetricoolData = async (platform, from, to) => {
    try {
        // NOTE: Endpoint ini adalah asumsi berdasarkan pola umum API Metricool.
        // Silakan sesuaikan endpoint spesifik jika dokumentasi resmi berbeda.
        // Biasanya formatnya: /analytics/{platform}/stats atau sejenisnya
        const response = await axios.get(`${METRICOOL_API_BASE_URL}/analytics/results`, {
            params: {
                blogId: BLOG_ID,
                userToken: USER_TOKEN,
                from: from,
                to: to,
                platform: platform
            },
            timeout: 10000 // 10 seconds timeout
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching data from Metricool for ${platform}:`, error.message);
        throw error;
    }
};

// Helper khusus untuk Instagram Stories (jika endpoint terpisah)
const fetchInstagramStories = async (from, to) => {
    try {
        const response = await axios.get(`${METRICOOL_API_BASE_URL}/analytics/stories`, {
            params: {
                blogId: BLOG_ID,
                userToken: USER_TOKEN,
                from: from,
                to: to
            },
            timeout: 10000
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching Instagram Stories:', error.message);
        return null; // Return null agar tidak memblokir data utama jika gagal
    }
};

// --- Controllers ---

exports.getFacebookAnalytics = async (req, res) => {
    try {
        const { from, to } = req.query;
        validateDates(from, to);

        const rawData = await fetchMetricoolData('facebook', from, to);
        
        // Asumsi struktur rawData, sesuaikan dengan response asli Metricool
        const metrics = rawData.metrics || {};
        const interactions = rawData.interactions || {};

        const formattedData = {
            platform: 'Facebook',
            period: { from, to },
            metrics: {
                post_count: metrics.posts || 0,
                page_views: metrics.page_views || 0,
                followers: metrics.community || 0, // Community seringkali = followers
                reach: metrics.reach || 0,
                impressions: metrics.impressions || 0
            },
            interactions: {
                clicks: interactions.clicks || 0,
                likes: interactions.likes || 0,
                comments: interactions.comments || 0,
                shares: interactions.shares || 0
            }
        };

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

exports.getTwitterAnalytics = async (req, res) => {
    try {
        const { from, to } = req.query;
        validateDates(from, to);

        const rawData = await fetchMetricoolData('twitter', from, to);
        const metrics = rawData.metrics || {};
        const interactions = rawData.interactions || {};

        const formattedData = {
            platform: 'Twitter (X)',
            period: { from, to },
            metrics: {
                tweets_count: metrics.tweets || 0,
                profile_views: metrics.profile_views || 0,
                followers: metrics.followers || 0,
                reach: metrics.reach || 0,
                impressions: metrics.impressions || 0
            },
            interactions: {
                likes: interactions.likes || 0,
                replies: interactions.replies || 0, // Comments mapped to replies
                retweets: interactions.retweets || 0,
                quotes: interactions.quotes || 0
            }
        };

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

exports.getInstagramAnalytics = async (req, res) => {
    try {
        const { from, to } = req.query;
        validateDates(from, to);

        // Fetch Main Data (Feed) & Stories secara paralel
        const [feedData, storiesData] = await Promise.all([
            fetchMetricoolData('instagram', from, to),
            fetchInstagramStories(from, to)
        ]);

        const metrics = feedData.metrics || {};
        const interactions = feedData.interactions || {};
        const stories = storiesData || {};

        const formattedData = {
            platform: 'Instagram',
            period: { from, to },
            metrics: {
                posts_count: metrics.posts || 0,
                profile_views: metrics.profile_views || 0,
                followers: metrics.followers || 0,
                reach: metrics.reach || 0,
                impressions: metrics.impressions || 0
            },
            interactions: {
                likes: interactions.likes || 0,
                comments: interactions.comments || 0,
                saves: interactions.saves || 0,
                shares: interactions.shares || 0
            },
            stories_analytics: {
                reach: stories.reach || 0,
                impressions: stories.impressions || 0,
                count: stories.count || 0 // Optional: jumlah stories
            }
        };

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

exports.getTiktokAnalytics = async (req, res) => {
    try {
        const { from, to } = req.query;
        validateDates(from, to);

        const rawData = await fetchMetricoolData('tiktok', from, to);
        const metrics = rawData.metrics || {};
        const interactions = rawData.interactions || {};

        const formattedData = {
            platform: 'TikTok',
            period: { from, to },
            metrics: {
                video_count: metrics.videos || 0,
                profile_views: metrics.profile_views || 0,
                followers: metrics.followers || 0,
                reach: metrics.reach || 0,
                impressions: metrics.impressions || 0
            },
            interactions: {
                likes: interactions.likes || 0,
                comments: interactions.comments || 0,
                shares: interactions.shares || 0,
                saves: interactions.saves || 0
            }
        };

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

exports.getYoutubeAnalytics = async (req, res) => {
    try {
        const { from, to } = req.query;
        validateDates(from, to);

        const rawData = await fetchMetricoolData('youtube', from, to);
        const metrics = rawData.metrics || {};
        const interactions = rawData.interactions || {};

        const formattedData = {
            platform: 'YouTube',
            period: { from, to },
            metrics: {
                video_count: metrics.videos || 0,
                views: metrics.views || 0,
                subscribers: metrics.subscribers || 0,
                reach: metrics.reach || 0, // Jika ada
                impressions: metrics.impressions || 0
            },
            interactions: {
                likes: interactions.likes || 0,
                comments: interactions.comments || 0,
                shares: interactions.shares || 0,
                dislikes: interactions.dislikes || 0 // Sesuai requirement: field dislike
            }
        };

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

exports.getLinkedinAnalytics = async (req, res) => {
    try {
        const { from, to } = req.query;
        validateDates(from, to);

        const rawData = await fetchMetricoolData('linkedin', from, to);
        const metrics = rawData.metrics || {};
        const interactions = rawData.interactions || {};

        const formattedData = {
            platform: 'LinkedIn',
            period: { from, to },
            metrics: {
                post_count: metrics.posts || 0,
                views: metrics.views || 0,
                followers: metrics.followers || 0,
                reach: metrics.reach || 0,
                impressions: metrics.impressions || 0
            },
            interactions: {
                likes: interactions.likes || 0,
                comments: interactions.comments || 0,
                shares: interactions.shares || 0,
                reposts: interactions.reposts || 0
            }
        };

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
