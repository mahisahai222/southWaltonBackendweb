const express = require('express');
const router = express.Router();

const { PaymentInfo,getAllPayments } = require('../controllers/PaymentController');

router.post('/register',PaymentInfo);
router.get('/pay', getAllPayments); 

module.exports = router;