require('dotenv').config()
const secretKey = process.env.STRIPE_SECRET_KEY
// const stripe = require('stripe')(secretKey);
const { v4: uuidv4 } = require('uuid');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


//For Reservation Price ($100)

const createCheckoutSession = async (req, res) => {
    try {
        const { amountInDollars, userId, bookingId, reservation, fromAdmin, paymentType } = req.body;

        if (!amountInDollars || !userId || !bookingId || !reservation || !fromAdmin || !paymentType) {
            return res.status(400).json({ error: "All fields (amount, userId, bookingId, reservation,fromAdmin,paymentType) are required" });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: { name: "Reservation Payment" },
                        unit_amount: amountInDollars * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `http://44.196.64.110:8133/payment-successfully?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: "http://44.196.64.110:8133/cancel",
            metadata: {
                userId,
                bookingId,
                reservation,
                fromAdmin,
                paymentType
            },
        });

        res.status(200).json({ session });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// For Damage Deposit Price ($250)

const createDamageDepositSession = async (userId, bookingId) => {
    const amountInDollars = 250; // Fixed amount for Damage Deposit

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: { name: "Damage Deposit" },
                    unit_amount: amountInDollars * 100,
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        success_url: `http://44.196.64.110:8133/payment-successfully?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://44.196.64.110:8133/cancel`,
        metadata: {
            userId,
            bookingId,
            paymentType: "Damage",
        },
    });

    return session;
};

//For Balance Amount include Tax,online fee and exclude Reservation 


const createBalancePaymentSession = async (userId, bookingId, totalAmount) => {
    const reservationAmount = 100; // Fixed Reservation Amount
    const damageDeposit = 250; // Fixed Damage Deposit

    // Calculate balance payment
    const remainingAmount = totalAmount - reservationAmount - damageDeposit;
    const tax = (remainingAmount * 7) / 100;
    const convenienceFee = (remainingAmount * 5) / 100;
    const balanceAmount = remainingAmount + tax + convenienceFee;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: { name: "Balance Payment" },
                    unit_amount: Math.round(balanceAmount * 100),
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        success_url: `http://44.196.64.110:8133/payment-successfully?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://44.196.64.110:8133/cancel`,
        metadata: {
            userId,
            bookingId,
            paymentType: "Balance",
        },
    });

    return session;
};






module.exports = {
     createCheckoutSession,createDamageDepositSession,createBalancePaymentSession
};
