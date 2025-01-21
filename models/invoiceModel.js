const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    email: String,
    customerid: String, // FreshBooks customer ID
    amount: Number,
    freshbooksInvoiceId: String,
    status: Number,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Invoice', invoiceSchema);
