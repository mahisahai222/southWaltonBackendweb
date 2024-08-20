// signModel.js

const mongoose = require('mongoose');

const signSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    signatureData: { type: String, required: true },
});

module.exports = mongoose.model('Sign', signSchema);
