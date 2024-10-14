// signModel.js
const mongoose = require('mongoose');

const signSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    image: { type: String, required: true }, // Ensure this field is named `image`
});

module.exports = mongoose.model('Sign', signSchema);
