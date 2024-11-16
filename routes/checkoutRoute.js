// routes/bookingRoutes.js
const express = require('express');
const upload = require('../middleware/multer'); // Import your multer setup
const { createBooking,bookingHistoryByUserId } = require('../controllers/checkoutController'); // Import the controller

const router = express.Router();

// Route to create booking with file uploads
router.post('/create', upload.fields([{ name: 'drivers[][license]', maxCount: 1 }, { name: 'drivers[][insurance]', maxCount: 1 }]), createBooking);
router.get('/history/:userId', bookingHistoryByUserId);
module.exports = router;
