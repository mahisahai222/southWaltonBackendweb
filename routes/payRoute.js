const express = require('express');
const router = express.Router();

const { PaymentInfo,getAllPayments,generateInvoice } = require('../controllers/PaymentController');

router.post('/register',PaymentInfo);
router.get('/pay', getAllPayments); 
router.get('/invoice/:paymentId', generateInvoice);



module.exports = router;