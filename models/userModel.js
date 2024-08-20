const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true
        },
        phoneNumber: {
            type: Number,
            required: true
        },
        state: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true
        },

        confirmPassword: {
            type: String,
            required: true
        },
    },
);

module.exports = mongoose.model('User', UserSchema);