const express = require('express');
const mongoose = require('mongoose');
const Reserve = require('../models/reserveModel');

const router = express.Router();
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')



const createReservation = async (req, res) => {
    try {
        const reserveform = new Reserve(req.body);
        const savedForm = await reserveform.save();     
        res.status(201).json({ id: savedForm._id });
    } catch (error) {
        res.status(400).json({ message: error.message });        
    }
};
const getAllReservations = async (req, res) => {
    try {
        const reservations = await Reserve.find();
        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single reservation by ID
const getReservationById = async (req, res) => {
    try {
        const reservation = await Reserve.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        res.status(200).json(reservation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a reservation
const updateReservation = async (req, res,next) => {
    try {
        const updatedReservation = await Reserve.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // This option returns the updated document
        );
        if (!updatedReservation) {
            return next(createError(404, "Reservation not found"))
        }
        return next(createSuccess(200, "Update succesfull", updatedReservation))
    } catch (error) {
        return next(createError(500, "Internal Server Error"))
    }
};

const getLatestReservation = async (req, res, next) => {
    try {
        const userId = req.params.userId; // Get userId from the request parameters

        const latestReservation = await Reserve.findOne({ userId }) // Filter by userId
            .sort({ createdAt: -1 }); // Sort by createdAt in descending order

        if (!latestReservation) {
            return next(createError(404, "No reservations found for this user"));
        }

        return next(createSuccess(200, "Latest Booking", latestReservation));
    } catch (error) {
        return next(createError(500, "Internal Server Error"));
    }
};



    
module.exports = {
    createReservation,
    getAllReservations,
    getReservationById,
    updateReservation,
    getLatestReservation
};
