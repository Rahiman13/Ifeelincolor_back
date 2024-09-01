const mongoose = require('mongoose');

// Define the schema for related media with Cloudinary URLs
const mediaSchema = new mongoose.Schema({
    images: [{
        url: {
            type: String, // URL to the image in Cloudinary
            required: true
        },
        public_id: {
            type: String, // Cloudinary public_id for easier deletion if needed
            required: true
        }
    }],
    documents: [{
        url: {
            type: String, // URL to the document in Cloudinary
            required: true
        },
        public_id: {
            type: String, // Cloudinary public_id for easier deletion if needed
            required: true
        }
    }],
    videos: [{
        url: {
            type: String, // URL to the video in Cloudinary
            required: true
        },
        public_id: {
            type: String, // Cloudinary public_id for easier deletion if needed
            required: true
        }
    }]
});

// Define the recommendation schema
const recommendationSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    recommendation: {
        type: String,
        required: true
    },
    relatedMedia: mediaSchema,
    recommendedBy: {
        type: mongoose.Schema.Types.ObjectId, // Clinician's ID
        ref: 'Clinisist',
        required: false
    },
    type: {
        type: String,
        enum: ['portal', 'doctor'],
        required: true,
        default : 'portal'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
