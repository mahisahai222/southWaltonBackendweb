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

// Create Booking
// const createBooking = async (req, res) => {
//     try {
//         const { 
//             bname, 
//             bphone, 
//             bemail, 
//             bsize, 
//             baddress, 
//             baddressh, 
//             customerDrivers 
//         } = req.body;

//         // Extract driver details and policy/license files from the request body
//         const dpolicyFile = req.files['dpolicy']?.[0];
//         const dlicenseFile = req.files['dlicense']?.[0];

//         if (!dpolicyFile || !dlicenseFile) {
//             return res.status(400).json({ message: 'dpolicy and dlicense images are required' });
//         }

//         // Upload images to S3
//         const dpolicyUrl = await uploadToS3(dpolicyFile);
//         const dlicenseUrl = await uploadToS3(dlicenseFile);

//         // Parse customerDrivers if it is passed as a JSON string
//         const parsedCustomerDrivers = JSON.parse(customerDrivers);

//         // Ensure customer drivers have all required fields (dname, demail, dphone, dexperience, dpolicy, dlicense)
//         const updatedCustomerDrivers = parsedCustomerDrivers.map(driver => ({
//             ...driver,
//             dpolicy: dpolicyUrl,
//             dlicense: dlicenseUrl,
//             // Include other required fields
//             dname: driver.dname, 
//             demail: driver.demail, 
//             dphone: driver.dphone, 
//             dexperience: driver.dexperience
//         }));

//         // Create booking object
//         const booking = new Bookform({
//             bname,
//             bphone,
//             bemail,
//             bsize,
//             baddress,
//             baddressh,
//             customerDrivers: updatedCustomerDrivers
//         });

//         await booking.save();
//         res.status(201).json({ message: 'Booking created successfully', booking });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error', error: error.message });
//     }
// };
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

      // Extract driver details and policy/license files from the request body
      const dpolicyFile = req.files['dpolicy']?.[0];
      const dlicenseFile = req.files['dlicense']?.[0];

      if (!dpolicyFile || !dlicenseFile) {
          return res.status(400).json({ message: 'dpolicy and dlicense images are required' });
      }

      // Upload images to S3
      const dpolicyUrl = await uploadToS3(dpolicyFile);
      const dlicenseUrl = await uploadToS3(dlicenseFile);

      // Parse customerDrivers if it is passed as a JSON string
      const parsedCustomerDrivers = JSON.parse(customerDrivers);

      // Ensure customer drivers have all required fields (dname, demail, dphone, dexperience, dpolicy, dlicense)
      const updatedCustomerDrivers = parsedCustomerDrivers.map(driver => ({
          ...driver,
          dpolicy: dpolicyUrl,
          dlicense: dlicenseUrl,
          // Include other required fields
          dname: driver.dname, 
          demail: driver.demail, 
          dphone: driver.dphone, 
          dexperience: driver.dexperience
      }));

      // Create booking object
      const booking = new Bookform({
          bname,
          bphone,
          bemail,
          bsize,
          baddress,
          baddressh,
          customerDrivers: updatedCustomerDrivers
      });

      // Save booking to the database
      const savedBooking = await booking.save();

      // Respond with the saved booking ID and other details
      res.status(201).json({ 
          message: 'Booking created successfully', 
          bookingId: savedBooking._id, // Send the ID of the created booking
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



// Get Latest Payment by User ID
const getLatestPaymentByUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;

        const latestPayment = await Payment.findOne({ userId }).sort({ createdAt: -1 });

        if (!latestPayment) {
            return next(createError(404, "No payments found for this user"));
        }
        const bookingDetails = await Bookform.findOne({ _id: latestPayment.bookingId });

        if (!bookingDetails) {
            return next(createError(404, "Booking details not found"));
        }

        let vehicleDetails = null;
        if (bookingDetails.vehiclesId) {
            vehicleDetails = await Vehicle.findOne({ _id: bookingDetails.vehiclesId });
        }

        const response = {
            ...latestPayment.toObject(),
            bookingDetails: {
                ...bookingDetails.toObject(),
                vehicleDetails,
            },
        };

        return next(createSuccess(200, "Latest Payment with Booking and Vehicle Details", response));
    } catch (error) {
        return next(createError(500, "Internal Server Error"));
    }
};

module.exports = {
    createBooking,
    bookingHistoryByUserId,
    getLatestPaymentByUser
};

