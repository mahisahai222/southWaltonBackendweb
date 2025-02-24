const cron = require('node-cron');
const Payment = require('../models/PaymentModel'); // Update path as needed
const Reservation = require('../models/reserveModel'); // Update path as needed
const emailService = require('./emailService'); // Update path as needed
const stripeService = require("../controllers/paymentGatewayController");
const mongoose = require('mongoose');

// Cron job to run daily at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Cron job started:', new Date());
    try {
        const today = new Date();
        const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

        const targetDateUTC = new Date(todayUTC); // Start of today
        const endDateUTC = new Date(todayUTC);
        endDateUTC.setDate(todayUTC.getDate() + 21); // 21 days from today

        console.log('Today UTC:', todayUTC);
        console.log('Target Date Range:', { from: targetDateUTC, to: endDateUTC });

        const payments = await Payment.find({
            paymentType: 'Reservation',
            mailSent: false,
        });
        console.log('Payments:', payments);

        const reservationIds = payments.map(payment =>
            mongoose.Types.ObjectId.isValid(payment.reservation) ? new mongoose.Types.ObjectId(payment.reservation) : null
        ).filter(Boolean);
        console.log('Validated Reservation IDs:', reservationIds);

        const allReservations = await Reservation.find({ _id: { $in: reservationIds } });
        console.log('All Reservations:', allReservations);

        const reservations = await Reservation.find({
            _id: { $in: reservationIds },
            pickdate: {
                $gte: targetDateUTC, // Start of today
                $lte: endDateUTC,    // 21 days from today
            },
        });
        console.log('Matching Reservations:', reservations);

        for (const payment of payments) {
            const reservation = reservations.find(res => res._id.toString() === payment.reservation);
            
            if (!reservation) continue;

            const pickDate = new Date(reservation.pickdate);
            const diffInDays = Math.ceil((pickDate - todayUTC) / (1000 * 60 * 60 * 24));

            console.log('Pick Date:', pickDate);
            console.log('Today UTC:', todayUTC);
            console.log('Difference in Days:', diffInDays);
            const email = payment.paymentDetails.transactionDetails.payment_method.billing_details.email
            if (diffInDays <= 21) {
                const damageSession = await stripeService.createDamageDepositSession(payment.userId, payment.reservation);
                const damageSessionUrl = damageSession.url;
                console.log("payment",payment.amount)
                const balanceSession = await stripeService.createBalancePaymentSession(payment.userId, payment.reservation, payment.amount);
                const balanceSessionUrl = balanceSession.url;

                await emailService.sendPaymentEmail(email, damageSessionUrl, balanceSessionUrl);
                payment.mailSent = true;
                await payment.save();
            }
        }

        console.log('Cron job executed successfully.');
    } catch (error) {
        console.error('Error executing cron job:', error);
    }
});

