const express = require('express');
const { createInvoiceForCustomer } = require('../controllers/invoiceController');
const router = express.Router();

router.post('/create', createInvoiceForCustomer);

module.exports = router;
