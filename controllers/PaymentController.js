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
const stripeService = require("./paymentGatewayController");
const emailService = require("../middleware/emailService");


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
            paymentType: session.metadata.paymentType,
            amount: session.metadata.amountInDollars
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
            amount: paymentDetails.amount,
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

//for Reservation Payment Details

const sendPaymentConfirmationEmail = async (email, paymentInfo) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: "development.aayaninfotech@gmail.com",
                pass: "defe qhhm kgmu ztkf",
            },
        });

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Details of Reservation</title>
                <style>
                    body {
                        background-color: #f8f9fa;
                    }
                    .email-container {
                        max-width: 700px;
                        margin: auto;
                        background: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    .logo {
                        background: #ffffff;
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 1px solid #333;
                    }
                    .btn-primary {
                        background-color: #007bff;
                        border: none;
                        padding: 10px 20px;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 5px;
                    }
                    .btn-primary:hover {
                        background-color: #0056b3;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    table, th, td {
                        border: 1px solid #ddd;
                    }
                    th, td {
                        padding: 10px;
                        text-align: left;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="logo">
                        <img src="cid:logo1" alt="Company Logo" style="width: 150px;">
                        <img src="cid:logo2" alt="Company Logo" style="width: 150px;">
                    </div>
                    <h2 class="text-center">Invoice Details</h2>
                    <p>Dear Customer,</p>
                    <p>Thank you for your payment. Below are your invoice details:</p>
                    <table>
                        <tr><th>Amount</th><td>$${paymentInfo.amount}</td></tr>
                        <tr><th>Payment ID</th><td>${paymentInfo.paymentId}</td></tr>
                        <tr><th>Payment Status</th><td>${paymentInfo.paymentStatus}</td></tr>
                    </table>
                    <p><em>Note: This invoice was not generated by Freshbook.</em></p>
                    <p><em>This is a computer-generated invoice for acknowledgment purposes.</em></p>
                    <div class="text-center">
                        <a href="#" class="btn-primary">Print Invoice</a>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: "development.aayaninfotech@gmail.com",
            to: email,
            subject: "Reservation Payment Confirmation",
            html: htmlContent,
            attachments: [
                {
                    filename: 'logo1.png',
                    path: 'assets/img/freshbook.png',
                    cid: 'logo1',
                },
                {
                    filename: 'logo2.png',
                    path: 'assets/img/logo-south-walton.png',
                    cid: 'logo2',
                },
            ],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw new Error("Failed to send payment confirmation email.");
    }
};



//Mail for Damage Deposit and Balance Invoice

const sendPaymentLinksInAdvance = async (req, res) => {
    try {
        const { userId, reservation, totalAmount, userEmail } = req.body;

        // Generate Damage Deposit payment session
        const damageSession = await stripeService.createDamageDepositSession(userId, reservation);
        const damageSessionUrl = damageSession.url;

        // Generate Balance Payment session
        const balanceSession = await stripeService.createBalancePaymentSession(userId, reservation, totalAmount);
        const balanceSessionUrl = balanceSession.url;

        // Send email with payment links
        await emailService.sendPaymentEmail(userEmail, damageSessionUrl, balanceSessionUrl);

        res.status(200).json({ message: "Payment links sent via email successfully." });
    } catch (error) {
        console.error("Error in sending payment links:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// Export the handler functions
module.exports = {
    PaymentInfo,
    getAllPayments,
    generateInvoice,
    sendInvoiceWithMail,
    completePayment,
    sendPaymentLinksInAdvance
};
