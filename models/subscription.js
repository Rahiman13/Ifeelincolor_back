const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true,
    },
    clinisist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinisist',
        default: null,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
    }
},{
    timestamps: true,
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
