const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['mcq', 'blanks'],
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    media: {
        type: String,  // Store the Cloudinary URL here
        default: null,
    },
    mcqOptions: [{
        text: { type: String, required: false },
        isCorrect: { type: Boolean, required: false, default:false }
    }] // Array of objects to store options and their correctness
});

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;
    