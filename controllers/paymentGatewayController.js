require('dotenv').config()
const secretKey = process.env.STRIPE_SECRET_KEY
// const stripe = require('stripe')(secretKey);
const { v4: uuidv4 } = require('uuid');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


// const createPaymentIntent = async (req, res) => {
//     try {
//         const { amountInDollars } = req.body;

//         // Validate amountInDollars
//         if (!amountInDollars || amountInDollars <= 0) {
//             return res.status(400).json({ error: 'Invalid amount' });
//         }

//         // Convert dollars to cents
//         const amountInCents = Math.round(amountInDollars * 100);

//         // Generate a unique ID for this payment request
//         const paymentRequestId = uuidv4();

//         // Create the payment intent
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount: amountInCents,
//             currency: 'usd',
//             description: `Payment request ID: ${paymentRequestId}`,
//         });

//         // Return the client secret, payment request ID, and transaction ID
//         return res.json({
//             clientSecret: paymentIntent.client_secret,
//             paymentRequestId,
//             transactionId: paymentIntent.id,
            
//         });
//     } catch (error) {
//         console.error('Error creating payment intent:', error);
//         if (!res.headersSent) {
//             res.status(500).send('Internal Server Error');
//         }
//     }
// };


const createCheckoutSession = async (req, res) => {
    try {
        const { amountInDollars, userId, bookingId, reservation } = req.body;

        if (!amountInDollars || !userId || !bookingId || !reservation) {
            return res.status(400).json({ error: "All fields (amount, userId, bookingId, reservation) are required" });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: { name: "Generic Payment" },
                        unit_amount: amountInDollars * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `http://44.196.64.110:5173/payment-successfully?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: "http://44.196.64.110:5173/cancel",
            metadata: {
                userId,
                bookingId,
                reservation,
            },
        });

        res.status(200).json({ session });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




module.exports = {
    // createPaymentIntent
     createCheckoutSession
};
