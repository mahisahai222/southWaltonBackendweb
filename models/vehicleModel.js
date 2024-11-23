const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vname: { type: String, required: true },
  damagePrice: { type: String, required: false },
  passenger: {
    type: String,
    enum: ['fourPassenger', 'sixPassenger', 'eightPassenger'],
    required: true,
  },
  vprice: [
    {
      season: { type: String, enum: ['offseason', 'secondaryseason', 'peakseason'], required: false },
      day: { type: String, enum: ['oneDay', 'twoDay', 'threeDay', 'fourDay', 'fiveDay', 'sixDay', 'weeklyRental'], required: false },
      price: { type: Number, required: false },
    },
  ],
  image: { type: [String] },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);