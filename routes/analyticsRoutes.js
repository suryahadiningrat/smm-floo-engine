const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Definisi Routes sesuai spesifikasi
// Prefix /api/v1 akan di-handle di server.js

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

module.exports = router;
