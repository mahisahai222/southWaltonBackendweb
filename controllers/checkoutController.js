// const express = require('express');
// const mongoose = require('mongoose');
// const Bookform = require('../models/checkoutModel'); // Adjust the path according to your file structure

// const router = express.Router();

// // Create a new booking form
// // const createBookform = async (req, res) => {
// //     try {
// //         const bookform = new Bookform(req.body);
// //         const savedForm = await bookform.save();
// //         res.status(201).json(savedForm);
// //     } catch (error) {
// //         res.status(400).json({ message: error.message });
// //     }
// // };
// const createBookform = async (req, res) => {
//     try {
//         const bookform = new Bookform(req.body);  // Create a new bookform with the request body data
//         const savedForm = await bookform.save();  // Save the bookform to the database
//         res.status(201).json({ id: savedForm._id });  // Respond with only the saved form ID
//     } catch (error) {
//         res.status(400).json({ message: error.message });  // Respond with error message in case of failure
//     }
// };

// // Get all booking forms
// const getAllBookforms = async (req, res) => {
//     try {
//         const bookforms = await Bookform.find();
//         res.json(bookforms);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // Get a specific booking form by ID
// const getBookformById = async (req, res) => {
//     try {
//         const bookform = await Bookform.findById(req.params.id);
//         if (!bookform) return res.status(404).json({ message: 'Booking form not found' });
//         res.json(bookform);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // Update a booking form by ID
// const updateBookform = async (req, res) => {
//     try {
//         const updatedForm = await Bookform.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         if (!updatedForm) return res.status(404).json({ message: 'Booking form not found' });
//         res.json(updatedForm);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };

// // Delete a booking form by ID
// const deleteBookform = async (req, res) => {
//     try {
//         const deletedForm = await Bookform.findByIdAndDelete(req.params.id);
//         if (!deletedForm) return res.status(404).json({ message: 'Booking form not found' });
//         res.json({ message: 'Booking form deleted' });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// module.exports = {
//     createBookform,
//     getAllBookforms,
//     getBookformById,
//     updateBookform,
//     deleteBookform
// };
// controllers/bookingController.js
// controllers/checkoutController.js
// controllers/bookingController.js
// controllers/bookingController.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Bookform = require('../models/checkoutModel'); // Adjust the path as needed

// Configure S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const createBooking = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Check the entire body

    const {
      bname,
      bphone,
      bemail,
      bsize,
      baddress,
      baddressh,
      vehiclesId,
      drivers,  // Ensure drivers are part of the request body
      reservationId  // Fetch the reservation ID from the request body
    } = req.body;

    console.log("Reservation ID:", reservationId); // Debugging reservationId

    const booking = new Bookform({
      bname,
      bphone,
      bemail,
      bsize,
      baddress,
      baddressh,
      vehiclesId,
      drivers: [], // Initialize empty drivers array
      reservationId, // Add reservation ID to the booking object
    });

    // Process drivers if provided
    if (drivers && Array.isArray(drivers)) {
      for (const driver of drivers) {
        const driverData = {
          dname: driver.name || driver.dname,
          dphone: driver.phone || driver.dphone,
          demail: driver.email || driver.demail,
          dexperience: driver.experience || driver.dexperience,
        };

        if (driver.license) {
          const licenseFileName = `drivers/licenses/${Date.now()}_${driver.license.originalname}`;
          await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: licenseFileName,
            Body: driver.license.buffer,
            ContentType: driver.license.mimetype,
          }));
          driverData.dlicense = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${licenseFileName}`;
        }

        if (driver.insurance) {
          const insuranceFileName = `drivers/insurance/${Date.now()}_${driver.insurance.originalname}`;
          await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: insuranceFileName,
            Body: driver.insurance.buffer,
            ContentType: driver.insurance.mimetype,
          }));
          driverData.dpolicy = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${insuranceFileName}`;
        }

        booking.drivers.push(driverData); // Push the driverData object into the array
      }
    }

    // Save booking to the database
    const savedBooking = await booking.save();
    console.log("Booking saved:", savedBooking); // Check if reservationId is saved

    return res.status(201).json({
      message: 'Booking created successfully!',
      id: savedBooking._id,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      message: 'Error creating booking',
      error: error.message,
    });
  }
};


module.exports = {
  createBooking,
};
