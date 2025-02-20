const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

// Configure the email service
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service provider
    auth: {
        user: 'development.aayaninfotech@gmail.com', // Your email
        pass: 'defe qhhm kgmu ztkf', // Your email password or app password
    },
});

// Function to send invoice email
const sendInvoiceEmail = async (payment) => {
    const mailOptions = {
        from: 'development.aayaninfotech@gmail.com',
        to: payment.email,
        subject: 'Invoice for Your Payment',
        html: `
            <h2>Invoice Details</h2>
            <p>Thank you for your payment.</p>
            <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
            <p><strong>Booking ID:</strong> ${payment.bookingId}</p>
            <p><strong>Amount:</strong> ${payment.amount}</p>
            <p><strong>Reservation:</strong> ${payment.reservation}</p>
            <p><strong>Phone:</strong> ${payment.phone}</p>
            <p><strong>Timestamp:</strong> ${payment.createdAt}</p>
            <p>We appreciate your business!</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: 'Invoice sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send invoice email');
    }
};


//Payment links for Damage deposit and Balance

const sendPaymentEmail = async (userEmail, damageSessionUrl, balanceSessionUrl) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail", // Use your email service provider
        auth: {
            user: 'development.aayaninfotech@gmail.com', // Your email
            pass: 'defe qhhm kgmu ztkf', // Your email password or app password
        },
    });

    // Load HTML email template
    const emailTemplatePath = path.join(__dirname, "../templates/payment-email.html");
    let emailContent = fs.readFileSync(emailTemplatePath, "utf-8");

    // Replace placeholders with dynamic data
    emailContent = emailContent
        .replace("{{damageSessionUrl}}", damageSessionUrl)
        .replace("{{balanceSessionUrl}}", balanceSessionUrl);

        await transporter.sendMail({
            from: 'development.aayaninfotech@gmail.com',
            to: userEmail,
            subject: "Complete Your Payments",
            html: emailContent,
            attachments: [
                {
                    filename: "freshbook.png",
                    path: path.join(__dirname, "../assets/img/freshbook.png"),
                    cid: "freshbook", // Use the same CID in the HTML <img> tag
                },
                {
                    filename: "logo-south-walton.png",
                    path: path.join(__dirname, "../assets/img/logo-south-walton.png"),
                    cid: "south-walton",
                },
            ],
        });
        
};

module.exports = { sendPaymentEmail,sendInvoiceEmail };
