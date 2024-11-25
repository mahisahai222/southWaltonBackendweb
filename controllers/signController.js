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
const upload = require('../middleware/multer');
const { S3 } = require('@aws-sdk/client-s3');

const s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION,
});

exports.saveImageUrl = async (req, res) => {
    // Use multer middleware
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        }

        const { userId } = req.body;
        const { file } = req;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        if (!file) {
            return res.status(400).json({ success: false, message: 'Image is required.' });
        }

        try {
            // Sanitize the file name by replacing spaces with hyphens
            const sanitizedFileName = `${Date.now()}-${file.originalname.replace(/ /g, '-')}`;

            // S3 upload parameters
            const params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: sanitizedFileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            // Upload to S3
            await s3.putObject(params);

            // Construct the file URL
            const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${sanitizedFileName}`;

            // Save image URL and userId to the database
            const newImage = new Image({ userId, image: fileUrl });
            await newImage.save();

            // Return success response
            return res.status(201).json({
                success: true,
                message: 'Image URL saved successfully.',
                data: newImage,
            });
        } catch (error) {
            console.error('Error saving image URL:', error);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    });
};
exports.updateSign = async (req, res) => {
    const { userId, image, pdf } = req.body;  // Assume image and pdf URLs are passed in the body

    // Validate that userId is provided
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    try {
        // Find the existing image record by userId
        const imageRecord = await Image.findOne({ userId });

        if (!imageRecord) {
            return res.status(404).json({ success: false, message: 'Image record not found.' });
        }

        // Prepare an object with the fields to update
        const updateData = {};
        if (image) {
            updateData.image = image;  // Only update image if provided
        }
        if (pdf) {
            updateData.pdf = pdf;  // Only update pdf if provided
        }

        // Update the image record using findByIdAndUpdate
        const updatedImage = await Image.findByIdAndUpdate(
            imageRecord._id,  // Use the _id of the image record found
            { $set: updateData },  // Set the updated fields in the document
            { new: true }  // Return the updated document
        );

        // Return the updated image record
        return res.status(200).json({
            success: true,
            message: 'Image record updated successfully.',
            data: updatedImage,  // Send the updated data back
        });
    } catch (error) {
        console.error('Error updating image record:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.', details: error.message });
    }
};
exports.getImageByUserId = async (req, res) => {
    const { userId } = req.params; // Retrieve userId from the URL parameter

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    try {
        // Find the image record by userId
        const imageRecord = await Image.findOne({ userId });

        if (!imageRecord) {
            return res.status(404).json({ success: false, message: 'Image record not found.' });
        }

        // Return the image record including the image URL and PDF URL (if available)
        return res.status(200).json({
            success: true,
            message: 'Image record retrieved successfully.',
            data: imageRecord,
        });
    } catch (error) {
        console.error('Error retrieving image record:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.', details: error.message });
    }
};
exports.getAllImages = async (req, res) => {
    try {
        // Retrieve all image records from the database
        const allImages = await Image.find();

        if (allImages.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No image records found.',
            });
        }

        // Return all image records
        return res.status(200).json({
            success: true,
            message: 'All image records retrieved successfully.',
            data: allImages,
        });
    } catch (error) {
        console.error('Error retrieving all image records:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
            details: error.message,
        });
    }
};
