const express = require('express');
const mongoose = require('mongoose');
const Payment = require('../models/PaymentModel'); // Ensure this path is correct
const fs = require('fs');
const PDFDocument = require('pdfkit');
const router = express.Router();
const { sendInvoiceEmail } = require('../middleware/emailService');
const Reserve = require('../models/reserveModel');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { recordPayment,createInvoice } = require('../middleware/freshbooksService');
const nodemailer = require('nodemailer');

// Handler function to create and save payment info
const PaymentInfo = async (req, res) => {
    try {

        const createPayment = new Payment(req.body);
        const savedPayment = await createPayment.save();
        const updatedReservation = await Reserve.findByIdAndUpdate(
            req.body.reservation,
            { accepted: true },
            { new: true }
        );

        if (!updatedReservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        res.status(201).json(savedPayment);
    } catch (error) {
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

const generateInvoice = async (req, res) => {
    const { paymentId } = req.params;

    try {
        // Fetch the payment details by paymentId
        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Create a new PDF document
        const doc = new PDFDocument();

        // Set headers for the response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${paymentId}.pdf`);

        // Pipe the PDF stream to the response
        doc.pipe(res);

        // Add invoice content to the PDF
        doc
            .fontSize(25)
            .text('Invoice', { align: 'center' })
            .moveDown();

        doc.fontSize(14).text(`Invoice ID: ${paymentId}`);
        doc.text(`Transaction ID: ${payment.transactionId}`);
        doc.text(`User ID: ${payment.userId}`);
        doc.text(`Email: ${payment.email}`);
        doc.text(`Phone: ${payment.phone}`);
        doc.text(`Booking ID: ${payment.bookingId}`);
        doc.text(`Reservation: ${payment.reservation}`);
        doc.text(`Amount Paid: ₹${payment.amount}`);
        doc.text(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`);

        // Footer
        doc
            .moveDown()
            .fontSize(10)
            .text('Thank you for your payment!', { align: 'center' });

        // Finalize the PDF
        doc.end();
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ message: 'Failed to generate invoice' });
    }
};

//invoicewithdetailsto user mail

const sendInvoiceWithMail = async (req, res) => {
    try {
        const { paymentId } = req.params;

        // Fetch payment details from the database
        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Send invoice email
        const emailResponse = await sendInvoiceEmail(payment);

        return res.status(200).json({
            success: true,
            message: 'Invoice email sent successfully',
            emailResponse,
        });
    } catch (error) {
        console.error('Error in sendInvoice:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

//complete payment

const completePayment = async (req, res) => {
    try {
        const sessionId = req.query.session_id;

        if (!sessionId) {
            return res.status(400).json({ error: "Session ID is required" });
        }

        const [session, lineItems] = await Promise.all([
            stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.payment_method'] }),
            stripe.checkout.sessions.listLineItems(sessionId),
        ]);

        if (!session) {
            return res.status(404).json({ error: "Payment session not found" });
        }

        // Check if payment with the same session ID already exists
        const existingPayment = await Payment.findOne({ 'paymentDetails.sessionId': sessionId });
        if (existingPayment) {
            return res.status(200).json({
                success: true,
                status: 200,
                message: "Payment already processed.",
                data: existingPayment,
            });
        }

        const paymentDetails = {
            bookingId: session.metadata.bookingId,
            userId: session.metadata.userId,
            reservation: session.metadata.reservation,
            fromAdmin: session.metadata.fromAdmin,
            paymentType: session.metadata.paymentType
        };

        const paymentInfo = {
            paymentMethod: session.payment_intent?.payment_method_types?.[0] || "Unknown",
            paymentId: session.payment_intent?.id || "",
            sessionId: session.id || "",
            paymentStatus: session.payment_status === "paid" ? "Paid" : session.payment_status,
            transactionDetails: session.payment_intent || "",
            amount: session.amount_total / 100 || 0, // Convert amount to dollars (Stripe stores in cents)
        };
        const customerEmail =
            session.customer_email ||
            session.payment_intent?.payment_method?.billing_details?.email ||
            null;

        if (!customerEmail) {
            return res.status(400).json({ error: "Customer email is missing in the payment session." });
        }

        // Save payment information to the database
        const newPayment = new Payment({
            userId: paymentDetails.userId,
            bookingId: paymentDetails.bookingId,
            reservation: paymentDetails.reservation,
            fromAdmin: paymentDetails.fromAdmin,
            paymentType: paymentDetails.paymentType,
            paymentDetails: paymentInfo,
        });

        await newPayment.save();


        // Step 1: Create Invoice in FreshBooks
        const invoiceResponse = await createInvoice(customerEmail, paymentInfo.amount);

        if (!invoiceResponse) {
            throw new Error("Failed to create invoice in FreshBooks.");
        }


        // Step 2: Record Payment in FreshBooks
        await recordPayment(customerEmail, paymentInfo.amount);

        await sendPaymentConfirmationEmail(customerEmail, paymentInfo);

        res.status(200).json({
            success: true,
            status: 200,
            message: "Payment completed successfully!",
            data: newPayment,
        });
    } catch (error) {
        console.error("Error in completing the payment:", error.message);
        res.status(500).json({
            success: false,
            status: 500,
            message: "Internal server error!",
            error: error.message,
        });
    }
};

const sendPaymentConfirmationEmail = async (email, paymentInfo) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
              user: "development.aayaninfotech@gmail.com", 
              pass: "defe qhhm kgmu ztkf", 
            },
        });

        const mailOptions = {
            from: "development.aayaninfotech@gmail.com", // Sender address
            to: email, // Receiver email
            subject: "Reservation Payment Confirmation", // Subject line
            html: `
                <h1>Reservation Payment Confirmation</h1>
                <p>Dear Customer,</p>
                <p>Thank you for your payment. Here are the details:</p>
                <ul>
                    <li><strong>Amount:</strong> $${paymentInfo.amount}</li>
                    <li><strong>Payment ID:</strong> ${paymentInfo.paymentId}</li>
                    <li><strong>Payment Status:</strong> ${paymentInfo.paymentStatus}</li>
                </ul>
                <p>If you have any questions, feel free to contact us.</p>
                <p>Best regards,</p>
                <p>South Walton Carts</p>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
       
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw new Error("Failed to send payment confirmation email.");
    }
};




// Export the handler functions
module.exports = {
    PaymentInfo,
    getAllPayments,
    generateInvoice,
    sendInvoiceWithMail,
    completePayment
};
