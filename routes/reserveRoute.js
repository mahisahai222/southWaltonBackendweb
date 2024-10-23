const express = require('express');
const { createReservation, getAllReservations, getReservationById, updateReservation } = require('../controllers/reserveController');

const router = express.Router();

router.post('/reservation', createReservation);            // Create a new reservation
router.get('/reservations', getAllReservations);           // Get all reservations
router.get('/reservation/:id', getReservationById);        // Get a reservation by ID
router.put('/reservation/:id', updateReservation);         // Update a reservation by ID

module.exports = router;