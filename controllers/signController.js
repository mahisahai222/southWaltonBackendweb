// // signController.js

// const Sign = require('../models/signModel');
// const fs = require('fs');
// const path = require('path');

// // Save signature
// exports.saveSignature = async (req, res) => {
//     try {
//         const { userId, signatureData } = req.body;

//         if (!userId || !signatureData) {
//             return res.status(400).json({ message: 'Missing userId or signatureData' });
//         }

//         console.log("Received userId:", userId); // Debugging line
//         console.log("Received signatureData:", signatureData); // Debugging line

//         const newSignature = new Sign({ userId, signatureData });
//         const savedSignature = await newSignature.save();
//         res.status(201).json(savedSignature);
//     } catch (error) {
//         console.error('Error saving signature:', error); // Enhanced debugging
//         res.status(500).json({ message: 'Failed to save signature', error });
//     }
// };

// // Get signature by ID
// exports.getSignature = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         if (!userId) {
//             return res.status(400).json({ message: 'User ID not provided' });
//         }

//         const signature = await Sign.findOne({ userId });
//         if (!signature) {
//             return res.status(404).json({ message: 'Signature not found' });
//         }

//         res.status(200).json(signature);
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to retrieve signature', error });
//     }
// };

// // Get all signatures
// exports.getAllSignatures = async (req, res) => {
//     try {
//         const signatures = await Sign.find();
//         if (!signatures.length) {
//             return res.status(404).json({ message: 'No signatures found' });
//         }

//         res.status(200).json(signatures);
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to retrieve signatures', error });
//     }
// };


// //delete
// exports.deleteSignature = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const deletedSignature = await Sign.findOneAndDelete({ userId });

//         if (!deletedSignature) {
//             return res.status(404).json({ message: 'Signature not found' });
//         }

//         res.status(200).json({ message: 'Signature deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to delete signature', error });
//     }
// };

// exports.getSignatureImage = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const signature = await Sign.findOne({ userId });

//         if (!signature) {
//             return res.status(404).json({ message: 'Signature not found' });
//         }

//         // Extract the Base64 string (removing the prefix if it exists)
//         const base64Data = signature.signatureData.replace(/^data:image\/png;base64,/, '');

//         // Convert Base64 string to buffer
//         const imgBuffer = Buffer.from(base64Data, 'base64');

//         // Set the content type and send the image as a response
//         res.setHeader('Content-Type', 'image/png');
//         res.send(imgBuffer);
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to retrieve signature image', error });
//     }
//   };
// const Image = require('../models/signModel');
// const multer = require('../middleware/multer'); // Adjust the path to your multer middleware

// // Controller to save image URL with user ID
// exports.saveImageUrl = (req, res) => {
//     multer.single('image')(req, res, async (err) => {
//         if (err) {
//             return res.status(400).json({
//                 success: false,
//                 message: err.message,
//             });
//         }

//         try {
//             const { userId } = req.body; // Get user ID from the request body

//             // Check if user ID is provided
//             if (!userId) {
//                 return res.status(400).json({ message: 'User ID is required.' });
//             }

//             // Check if file is uploaded
//             const { file } = req;
//             if (!file) {
//                 return res.status(400).json({ message: 'Image is required.' });
//             }

//             // Construct the image URL using your preferred method
//             const host = req.hostname;
//             const port = process.env.PORT || 5001;
//             const imageUrl = `${req.protocol}://${host}:${port}/uploads/${file.filename}`;

//             // Create new image entry with the correct field name
//             const newImage = new Image({ userId, image: imageUrl });
//             await newImage.save();

//             res.status(201).json({
//                 success: true,
//                 message: 'Image URL saved successfully.',
//                 data: newImage,
//             });
//         } catch (error) {
//             console.error('Error saving image URL:', error);
//             res.status(500).json({ message: 'Internal server error.', error: error.message });
//         }
//     });
// };
const Image = require('../models/signModel');
const upload = require('../middleware/multer'); // Updated multer middleware
const { S3 } = require('@aws-sdk/client-s3');

const s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION,
});

// Controller to save image URL with user ID
exports.saveImageUrl = (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        }

        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ message: 'User ID is required.' });
            }

            const { file } = req;
            if (!file) {
                return res.status(400).json({ message: 'Image is required.' });
            }

            // S3 upload parameters
            const params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: `${Date.now()}-${file.originalname}`, // File name
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            // Upload to S3
            const uploadResult = await s3.putObject(params);

            if (!uploadResult) {
                return res.status(500).json({ message: 'Failed to upload image to S3.' });
            }

            // Construct the S3 file URL
            const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

            // Save image URL and userId to database
            const newImage = new Image({ userId, image: fileUrl });
            await newImage.save();

            res.status(201).json({
                success: true,
                message: 'Image URL saved successfully.',
                data: newImage,
            });
        } catch (error) {
            console.error('Error saving image URL:', error);
            res.status(500).json({ message: 'Internal server error.', error: error.message });
        }
    });
};
