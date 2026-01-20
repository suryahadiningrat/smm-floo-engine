const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.post('/', projectController.createProject);
router.post('/:id/sync', projectController.triggerSync);

module.exports = router;
