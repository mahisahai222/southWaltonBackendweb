const nodemailer = require('nodemailer');
const Invoice = require('../models/invoiceModel');
const { createInvoice,getClientId } = require('../middleware/freshbooksService');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Or use your email provider
  auth: {
    user: "ut.gupta29@gmail.com", // Your email
    pass: "yver vjuu fvbb hcot", // Your email password
  },
});

// Function to send email
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: "ut.gupta29@gmail.com",
    to,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
};

exports.createInvoiceForCustomer = async (req, res) => {
  try {
    const { email, amount } = req.body;

    const clientId = await getClientId(email);

    // Create invoice in FreshBooks
    const invoice = await createInvoice(email, amount);

    // Save invoice details in MongoDB
    const savedInvoice = new Invoice({
      email,
      customerid: clientId,
      amount,
      freshbooksInvoiceId: invoice.response.result.invoice.id,
      status: invoice.response.result.invoice.status,
    });
    await savedInvoice.save();

    // Send email to the client
    const emailSubject = 'Invoice Created Successfully';
    const emailText = `Hello,\n\nYour invoice for $${amount} has been created successfully.\nInvoice ID: ${invoice.response.result.invoice.id}\nThank you!`;
    await sendEmail(email, emailSubject, emailText);

    res.status(200).json({ invoice: savedInvoice });
  } catch (error) {
    console.error('Error in createInvoice controller:', error);
    res.status(500).json({ error: error.message });
  }
};
