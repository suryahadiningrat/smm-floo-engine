const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Definisi Routes sesuai spesifikasi
// Prefix /api/v1 akan di-handle di server.js

// Facebook
router.get('/facebook/analytics', analyticsController.getFacebookAnalytics);
router.get('/facebook/posts', analyticsController.getFacebookPosts);
router.get('/facebook/stories', analyticsController.getFacebookStories);

// Twitter (X)
router.get('/twitter/analytics', analyticsController.getTwitterAnalytics);

// Instagram (Feed & Stories)
router.get('/instagram/analytics', analyticsController.getInstagramAnalytics); // Legacy/Aggregate
router.get('/instagram/account', analyticsController.getInstagramAccount); // New Account Performance
router.get('/instagram/community', analyticsController.getInstagramCommunity); // New Community
router.get('/instagram/posts', analyticsController.getInstagramPosts);
router.get('/instagram/reels', analyticsController.getInstagramReels);
router.get('/instagram/stories', analyticsController.getInstagramStories);

router.get('/instagram/metrics', analyticsController.getInstagramMetrics);
// AI Analysis
router.post('/instagram/analysis/sentiment', analyticsController.analyzeInstagramComments);


// TikTok
router.get('/tiktok/analytics', analyticsController.getTiktokAnalytics);

// YouTube
router.get('/youtube/analytics', analyticsController.getYoutubeAnalytics);

// LinkedIn
router.get('/linkedin/analytics', analyticsController.getLinkedinAnalytics);

module.exports = router;
