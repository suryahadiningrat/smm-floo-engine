const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Definisi Routes sesuai spesifikasi
// Prefix /api/v1 akan di-handle di server.js

// Facebook
router.get('/facebook/analytics', analyticsController.getFacebookAnalytics);

// Twitter (X)
router.get('/twitter/analytics', analyticsController.getTwitterAnalytics);

// Instagram (Feed & Stories)
router.get('/instagram/analytics', analyticsController.getInstagramAnalytics);

// TikTok
router.get('/tiktok/analytics', analyticsController.getTiktokAnalytics);

// YouTube
router.get('/youtube/analytics', analyticsController.getYoutubeAnalytics);

// LinkedIn
router.get('/linkedin/analytics', analyticsController.getLinkedinAnalytics);

module.exports = router;
