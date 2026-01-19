const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const analyticsController = require('../controllers/analyticsController');

router.post('/', userController.createUser);
router.get('/analyze', analyticsController.getAnalyzeList);
router.get('/analyze/:analyze_id', analyticsController.getAnalyzeResult);

module.exports = router;
