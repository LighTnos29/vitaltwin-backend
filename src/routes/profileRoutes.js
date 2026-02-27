const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// POST /profile — save profile + health input
router.post('/', profileController.createSubmission);

// GET /profile — latest submission
router.get('/', profileController.getSubmission);

// GET /profile/:id — submission by id
router.get('/:id', profileController.getSubmission);

module.exports = router;
