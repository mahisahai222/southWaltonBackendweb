const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookformSchema = new Schema({
    bname: { type: String, required: true },
    bphone: { type: Number, required: true },
    bemail: { type: String, required: true },
    bsize: { type: Number, required: true },
    baddress: { type: String, required: false },
    baddressh: { type: String, required: false },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: false },
    reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation', required: false },
    vehiclesId: { type: String, required: false },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
    status: { type: String, enum: ['PENDING', 'DELIVERED', 'COMPLETED'], default: 'PENDING' },

    // Adding customerDrivers
    customerDrivers: [{
        dphone: { type: String, required: true },
        demail: { type: String, required: true },
        dexperience: { type: String, required: true },
        dname: { type: String, required: true },
        dpolicy: { type: String, required: true }, // Storing image URL or path
        dlicense: { type: String, required: true }, // Storing image URL or path
    }]
}, { timestamps: true });

BookformSchema.pre('save', async function (next) {
    if (this.isModified('status') && this.status === 'COMPLETED') {
        await this.remove();
    }
    next();
});

module.exports = mongoose.model('Bookform', BookformSchema);
