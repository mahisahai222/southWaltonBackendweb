const express = require('express');
const mongoose = require('mongoose');
const Reserve = require('../models/reserveModel');

const router = express.Router();

// Create a new reservation
const createReservation = async (req, res) => {
    try {
        const reserveform = new Reserve(req.body);
        const savedForm = await reserveform.save();
        res.status(201).json({ id: savedForm._id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all reservations
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
const updateReservation = async (req, res) => {
    try {
        const updatedReservation = await Reserve.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // This option returns the updated document
        );
        if (!updatedReservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        res.status(200).json(updatedReservation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
    
module.exports = {
    createReservation,
    getAllReservations,
    getReservationById,
    updateReservation
};
