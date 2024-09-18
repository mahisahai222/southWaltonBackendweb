const express = require('express');
const mongoose = require('mongoose');
const Payment = require('../models/PaymentModel'); // Ensure this path is correct

const router = express.Router();

// Handler function to create and save payment info
const PaymentInfo = async (req, res) => {
    try {
        // Create a new Payment instance with data from req.body
        const createPayment = new Payment(req.body);

        // Save the new Payment document to the database
        const savedPayment = await createPayment.save();

        // Send a success response with the saved document
        res.status(201).json(savedPayment);
    } catch (error) {
        // Send an error response if something goes wrong
        res.status(400).json({ message: error.message });
    }
};

// Handler function to fetch all payment records
const getAllPayments = async (req, res) => {
    try {
        // Fetch all documents from the Payment collection
        const payments = await Payment.find();

        // Send a success response with the list of payments
        res.status(200).json(payments);
    } catch (error) {
        // Send an error response if something goes wrong
        res.status(500).json({ message: error.message });
    }
};

// Export the handler functions
module.exports = {
    PaymentInfo,
    getAllPayments,
};
