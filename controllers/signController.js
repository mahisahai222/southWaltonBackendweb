// signController.js

const Sign = require('../models/signModel');
const fs = require('fs');
const path = require('path');

// Save signature
exports.saveSignature = async (req, res) => {
    try {
        const { userId, signatureData } = req.body;

        if (!userId || !signatureData) {
            return res.status(400).json({ message: 'Missing userId or signatureData' });
        }

        console.log("Received userId:", userId); // Debugging line
        console.log("Received signatureData:", signatureData); // Debugging line

        const newSignature = new Sign({ userId, signatureData });
        const savedSignature = await newSignature.save();
        res.status(201).json(savedSignature);
    } catch (error) {
        console.error('Error saving signature:', error); // Enhanced debugging
        res.status(500).json({ message: 'Failed to save signature', error });
    }
};

// Get signature by ID
exports.getSignature = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: 'User ID not provided' });
        }

        const signature = await Sign.findOne({ userId });
        if (!signature) {
            return res.status(404).json({ message: 'Signature not found' });
        }

        res.status(200).json(signature);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve signature', error });
    }
};

// Get all signatures
exports.getAllSignatures = async (req, res) => {
    try {
        const signatures = await Sign.find();
        if (!signatures.length) {
            return res.status(404).json({ message: 'No signatures found' });
        }

        res.status(200).json(signatures);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve signatures', error });
    }
};


//delete
exports.deleteSignature = async (req, res) => {
    try {
        const { userId } = req.params;
        const deletedSignature = await Sign.findOneAndDelete({ userId });

        if (!deletedSignature) {
            return res.status(404).json({ message: 'Signature not found' });
        }

        res.status(200).json({ message: 'Signature deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete signature', error });
    }
};

exports.getSignatureImage = async (req, res) => {
    try {
        const { userId } = req.params;
        const signature = await Sign.findOne({ userId });
  
        if (!signature) {
            return res.status(404).json({ message: 'Signature not found' });
        }
  
        // Extract the Base64 string (removing the prefix if it exists)
        const base64Data = signature.signatureData.replace(/^data:image\/png;base64,/, '');
  
        // Convert Base64 string to buffer
        const imgBuffer = Buffer.from(base64Data, 'base64');
  
        // Set the content type and send the image as a response
        res.setHeader('Content-Type', 'image/png');
        res.send(imgBuffer);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve signature image', error });
    }
  };

