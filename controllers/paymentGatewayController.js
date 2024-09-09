const stripe = require('stripe')('sk_test_51PsifGP6k3IQ77YB04drrOcYDuqh48omJybBXNZ7Vtcb16Z0BoTSiN6krnHWGVHffE9bNeFIZn1cDuVsvUrYdIaz00e2NF9xcY');
const { v4: uuidv4 } = require('uuid');

const createPaymentIntent = async (req, res) => {
    try {
        const { amountInDollars } = req.body;
        console.log(amountInDollars);
        

        // Validate that amountInDollars is a valid number greater than zero
        if (!amountInDollars || amountInDollars <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Convert dollars to cents
        const amountInCents = Math.round(amountInDollars * 100);

        // Generate a unique ID for this payment request
        const paymentRequestId = uuidv4();

        // Create the payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            description: `Payment request ID: ${paymentRequestId}`,
        });

        // Return the client secret and payment request ID
        return res.json({ clientSecret: paymentIntent.client_secret, paymentRequestId });
        console.log("clientSecret", clientSecret);
        
    } catch (error) {
        console.error('Error creating payment intent:', error);
         // Ensure no other response is sent here
         if (!res.headersSent) {
            res.status(500).send('Internal Server Error');
        }
    }
};

module.exports = {
    createPaymentIntent,
};
