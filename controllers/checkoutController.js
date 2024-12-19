const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Bookform = require('../models/checkoutModel'); // Adjust the path as needed
const Payment = require('../models/PaymentModel');
const Reservation = require('../models/reserveModel'); // Adjust the path to your Reservation model
const Vehicle = require('../models/vehicleModel');

const upload = require('../middleware/multer'); // Assuming your multer middleware is set up as provided earlier

const createError = require('../middleware/error');
const createSuccess = require('../middleware/success');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Helper function to upload files to S3
const uploadToS3 = async (file) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `uploads/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype
    };
    const command = new PutObjectCommand(params);
    await s3.send(command);
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
};

const createBooking = async (req, res) => {
  try {
      const { 
          bname, 
          bphone, 
          bemail, 
          bsize, 
          baddress, 
          baddressh, 
          customerDrivers 
      } = req.body;

      const dpolicyFile = req.files['dpolicy']?.[0];
      const dlicenseFile = req.files['dlicense']?.[0];

      if (!dpolicyFile || !dlicenseFile) {
          return res.status(400).json({ message: 'dpolicy and dlicense images are required' });
      }
      const dpolicyUrl = await uploadToS3(dpolicyFile);
      const dlicenseUrl = await uploadToS3(dlicenseFile);

      const parsedCustomerDrivers = JSON.parse(customerDrivers);

      const updatedCustomerDrivers = parsedCustomerDrivers.map(driver => ({
          ...driver,
          dpolicy: dpolicyUrl,
          dlicense: dlicenseUrl,
          dname: driver.dname, 
          demail: driver.demail, 
          dphone: driver.dphone, 
          dexperience: driver.dexperience
      }));

      const booking = new Bookform({
          bname,
          bphone,
          bemail,
          bsize,
          baddress,
          baddressh,
          customerDrivers: updatedCustomerDrivers
      });

      const savedBooking = await booking.save();

      res.status(201).json({ 
          message: 'Booking created successfully', 
          bookingId: savedBooking._id,
          booking: savedBooking 
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Get Booking History by User ID
const bookingHistoryByUserId = async (req, res, next) => {
    const { userId } = req.params;

    try {
        // Fetch only the amount field from Payment model
        const payments = await Payment.find({ userId }).select('amount bookingId reservation');

        const paymentHistory = await Promise.all(
            payments.map(async (payment) => {
                const bookingDetails = payment.bookingId
                    ? await Bookform.findOne({ _id: payment.bookingId })
                    : null;

                const reservationDetails = payment.reservation
                    ? await Reservation.findOne(
                          { _id: payment.reservation },
                          'pickdate dropdate days pickup drop vehicleId' // Select required fields
                      )
                    : null;

                let vehicleDetails = null;
                if (reservationDetails && reservationDetails.vehicleId) {
                    // Fetch only vname and image from Vehicle collection
                    vehicleDetails = await Vehicle.findOne(
                        { _id: reservationDetails.vehicleId },
                        'vname image'
                    );
                }

                return {
                    amount: payment.amount, // Only include amount from Payment model
                    bookingDetails,
                    reservationDetails: reservationDetails
                        ? {
                              ...reservationDetails._doc,
                              vehicleDetails, // Attach selected vehicle details
                          }
                        : null,
                };
            })
        );

        return next(createSuccess(200, "History by userId", paymentHistory));
    } catch (error) {
        return next(createError(500, "Error fetching payment history"));
    }
};




module.exports = {
    createBooking,
    bookingHistoryByUserId
};

