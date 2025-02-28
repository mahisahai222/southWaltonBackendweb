require('dotenv').config()
const secretKey = process.env.STRIPE_SECRET_KEY
// const stripe = require('stripe')(secretKey);
const { v4: uuidv4 } = require('uuid');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


//For Reservation Price ($100)

const createCheckoutSession = async (req, res) => {
    try {
        const { amountInDollars, userId, bookingId, reservation, fromAdmin, paymentType } = req.body;

        if (!amountInDollars || !reservation || !fromAdmin || !paymentType) {
            return res.status(400).json({ error: "All fields (amountInDollars, reservation,fromAdmin,paymentType) are required" });
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
            success_url: `http://54.236.98.193:8133/payment-successfully?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: "http://54.236.98.193:8133/cancel",
            metadata: {
                userId,
                bookingId,
                reservation,
                fromAdmin,
                paymentType,
                amountInDollars
            },
        });

        res.status(200).json({ session });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};






module.exports = {
     createCheckoutSession
};
