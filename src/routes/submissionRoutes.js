const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// POST /submissions — save profile + health input (same as POST /profile)
router.post('/', profileController.createSubmission);

// GET /submissions/latest — get latest submission
router.get('/latest', profileController.getLatestSubmission);

module.exports = router;
