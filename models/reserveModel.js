const mongoose = require('mongoose');
const reserveSchema = mongoose.Schema(
    {
        pickup: {
            type: String,
            required: false
        },
        drop: {
            type: String,
            required: false
        },
        pickdate: {
            type: Date,  // Consider using Date type
            required: false
        },
        dropdate: {
            type: Date,  // Consider using Date type
            required: false
        },
        days: {
            type: String,
            required: false
        },
        vehicleid:{
            type:String,
            require:false
        },
        transactionid: {
            type: String,
            required: false
        },
        booking: {
            type: Boolean,
            required: false  // Added required: false for consistency
        },
        reservation: {
            type: Boolean,
            required: false  // Added required: false for consistency
        }
    }
);

module.exports = mongoose.model('Reservation', reserveSchema);
