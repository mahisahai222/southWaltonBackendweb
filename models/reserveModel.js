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
        userId:{
            type: String,
            required: false
        },
   
        pickdate: {
            type: Date, 
            required: false
        },
        dropdate: {
            type: Date, 
            required: false
        },
        days: {
            type: String,
            required: false
        },
        vehicleId:{
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
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Reservation', reserveSchema);
