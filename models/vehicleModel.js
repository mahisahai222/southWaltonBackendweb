const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({

    vname: {
        type: String,
        required: true,
    },

    vseats: {
        type: String,
        required: true,
    },
    vprice: {
        type: String,
        required: true,
    },

    image: {
        type: String,
    },
    Addtocart:{
        type:Boolean,
        required:false
    }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);