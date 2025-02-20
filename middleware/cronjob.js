const cron = require("node-cron");
const Payment = require("../models/PaymentModel");
const Reservation = require("../models/reserveModel");
const emailService = require("./emailService");

cron.schedule("0 0 * * *", async () => {
    try {
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + 21);

        // Find payments with Reservation type and upcoming pickdate
        const payments = await Payment.find({ paymentType: "Reservation" })
            .populate("reservation")
            .exec();

        const reservationsToEmail = payments.filter(payment => {
            const { reservation } = payment;
            return reservation && new Date(reservation.pickdate).toDateString() === targetDate.toDateString();
        });
        

        for (const payment of reservationsToEmail) {
            const { email, reservation } = payment;
            const { pickdate } = reservation;

            // Send email
            const damageSessionUrl = "Your damage session link"; // Generate dynamically
            const balanceSessionUrl = "Your balance session link"; // Generate dynamically

            await emailService.sendPaymentEmail(email, damageSessionUrl, balanceSessionUrl);

            console.log(`Email sent to ${email} for pickdate: ${pickdate}`);
        }
    } catch (error) {
        console.error("Error in cron job:", error);
    }
});
