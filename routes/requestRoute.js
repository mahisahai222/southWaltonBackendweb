const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');

// Create new "How to Buy" content
router.post('/create', requestController.createRequest);

module.exports = router;
