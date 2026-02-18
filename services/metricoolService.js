const axios = require('axios');

const METRICOOL_API_BASE_URL = 'https://app.metricool.com/api/v2';

// Helper: Format date to ISO 8601 with time
const formatToIsoDate = (dateStr, isEndOfDay = false) => {
    if (!dateStr) return null;
    if (dateStr.includes('T')) return dateStr;
    return isEndOfDay ? `${dateStr}T23:59:59` : `${dateStr}T00:00:00`;
};

/**
 * Fetch data from Metricool API
 * @param {string} platform - 'instagram', 'facebook', 'tiktok', etc.
 * @param {string} type - 'posts', 'stories', 'reels', 'community'
 * @param {string} from - YYYY-MM-DD
 * @param {string} to - YYYY-MM-DD
 * @param {string} blogId 
 * @param {string} userId 
 * @param {string} userToken 
 */
const fetchAnalytics = async (platform, type, from, to, blogId, userId, userToken) => {
    try {
        const endpoint = `${METRICOOL_API_BASE_URL}/analytics/${type}/${platform}`;
        const params = {
            blogId,
            userId,
            from: formatToIsoDate(from),
            to: formatToIsoDate(to, true)
        };

        console.log(`[MetricoolService] Fetching ${platform} ${type} from ${from} to ${to}`);

        const response = await axios.get(endpoint, {
            params,
            headers: {
                'X-Mc-Auth': userToken,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // Extended timeout
        });

        return response.data.data || [];
    } catch (error) {
        const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
        console.warn(`[MetricoolService] Failed to fetch ${type} for ${platform}: ${errorDetails}`);
        if (error.response && (error.response.status === 404 || error.response.status === 403)) {
            return [];
        }
        throw error;
    }
};

const fetchCompetitors = async (platform, from, to, blogId, userId, userToken) => {
    try {
        const endpoint = `${METRICOOL_API_BASE_URL}/analytics/competitors/${platform}`;
        const params = {
            blogId,
            userId,
            from: formatToIsoDate(from),
            to: formatToIsoDate(to, true),
            timezone: 'Asia/Jakarta', // Should be dynamic ideally
            limit: 100
        };

        const response = await axios.get(endpoint, {
            params,
            headers: {
                'X-Mc-Auth': userToken,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        return response.data.data || [];
    } catch (error) {
        console.warn(`[MetricoolService] Failed to fetch competitors for ${platform}: ${error.message}`);
        return [];
    }
};

const getAccountGrowth = async (platform, dateStr, blogId, userId, userToken, username) => {
    try {
        const data = await fetchCompetitors(platform, dateStr, dateStr, blogId, userId, userToken);
        // Try to find by known usernames
        const myAccount = data.find(c => 
            (c.screenName && c.screenName.toLowerCase() === username.toLowerCase()) || 
            (c.username && c.username.toLowerCase() === username.toLowerCase()) || 
            (c.providerId && String(c.providerId) === String(username))
        );
        return myAccount ? { 
            followers: myAccount.followers, 
            following: myAccount.following,
            posts: myAccount.posts
        } : null;
    } catch (error) {
        console.warn(`[MetricoolService] Failed to get account data for ${dateStr}: ${error.message}`);
        return null;
    }
};

const fetchPostComments = async (blogId, userId, userToken, params = {}) => {
    try {
        const endpoint = `${METRICOOL_API_BASE_URL}/inbox/post-comments`;
        const requestParams = {
            blogId,
            userId,
            provider: 'instagram',
            limit: 100,
            ...params
        };

        const response = await axios.get(endpoint, {
            params: requestParams,
            headers: {
                'X-Mc-Auth': userToken,
                'Content-Type': 'application/json'
            }
        });

        return response.data.data || [];
    } catch (error) {
        console.warn(`[MetricoolService] Failed to fetch post comments: ${error.message}`);
        return [];
    }
};

const fetchInboxConversations = async (blogId, userId, userToken, params = {}) => {
    try {
        const endpoint = `${METRICOOL_API_BASE_URL}/inbox/conversations`;
        const requestParams = {
            blogId,
            userId,
            provider: 'instagram',
            limit: 100, // Try to fetch max
            ...params
        };

        const response = await axios.get(endpoint, {
            params: requestParams,
            headers: {
                'X-Mc-Auth': userToken,
                'Content-Type': 'application/json'
            },
            timeout: 20000
        });

        return response.data.data || [];
    } catch (error) {
        console.warn(`[MetricoolService] Failed to fetch inbox conversations: ${error.message}`);
        return [];
    }
};

module.exports = {
    fetchAnalytics,
    fetchCompetitors,
    getAccountGrowth,
    fetchPostComments,
    fetchInboxConversations,
    formatToIsoDate
};
