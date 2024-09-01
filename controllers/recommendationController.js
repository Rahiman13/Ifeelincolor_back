const Recommendation = require('../models/Recommendation');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Clinisist = require('../models/Clinisist');
const moment = require('moment');

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dmst4lbrx',
    api_key: '828194579658255',
    api_secret: '4hij7lz9E3GNXkFgGW6XnvJ1DFo'
});



// Multer storage configuration for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        let folder = 'recommendation_media';
        if (file.fieldname === 'images') {
            folder += '/images';
        } else if (file.fieldname === 'documents') {
            folder += '/documents';
        } else if (file.fieldname === 'videos') {
            folder += '/videos';
        }

        return {
            folder: folder, // Folder in Cloudinary
            resource_type: file.fieldname === 'documents' ? 'raw' : 'auto', // Supports auto type for images, videos, etc.
        };
    }
});

const upload = multer({ storage: storage }).fields([
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 10 },
    { name: 'videos', maxCount: 10 }
]);

// Create a new recommendation
const createRecommendation = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading media:', err);
            return res.status(500).json({ status: 'error', body: null, message: 'Error uploading media' });
        }

        const { category, recommendation, recommendedBy, type } = req.body;
        const relatedMedia = {
            images: [],
            documents: [],
            videos: []
        };

        // Process uploaded files and store URLs and public_ids in relatedMedia
        if (req.files.images) {
            req.files.images.forEach(file => {
                relatedMedia.images.push({ url: file.path, public_id: file.filename });
            });
        }
        if (req.files.documents) {
            req.files.documents.forEach(file => {
                relatedMedia.documents.push({ url: file.path, public_id: file.filename });
            });
        }
        if (req.files.videos) {
            req.files.videos.forEach(file => {
                relatedMedia.videos.push({ url: file.path, public_id: file.filename });
            });
        }

        try {
            const newRecommendation = new Recommendation({
                category,
                recommendation,
                relatedMedia,
                recommendedBy,
                type
            });
            await newRecommendation.save();

            res.status(201).json({
                status: 'success',
                body: newRecommendation,
                message: 'Recommendation created successfully'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                body: null,
                message: 'Error creating recommendation'
            });
        }
    });
};
// Get all recommendations
const getRecommendations = async (req, res) => {
    try {
        const recommendations = await Recommendation.find({});
        res.json({
            status: 'success',
            body: recommendations,
            message: 'Recommendations retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error retrieving recommendations'
        });
    }
};

// Get a single recommendation by ID
const getRecommendationById = async (req, res) => {
    try {
        const recommendation = await Recommendation.findById(req.params.id);
        if (!recommendation) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Recommendation not found'
            });
        }
        res.json({
            status: 'success',
            body: recommendation,
            message: 'Recommendation retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error retrieving recommendation'
        });
    }
};

const updateRecommendation = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading media:', err);
            return res.status(500).json({ status: 'error', body: null, message: 'Error uploading media' });
        }

        try {
            const recommendationId = req.params.id;
            const { category, recommendation, recommendedBy, type } = req.body;
            const mediaUpdates = {
                images: [],
                documents: [],
                videos: []
            };

            // Process new media uploads
            if (req.files.images) {
                for (const file of req.files.images) {
                    const result = await cloudinary.uploader.upload(file.path, {
                        folder: 'recommendation_media/images'
                    });
                    mediaUpdates.images.push({ url: result.secure_url, public_id: result.public_id });
                }
            }

            if (req.files.documents) {
                for (const file of req.files.documents) {
                    const result = await cloudinary.uploader.upload(file.path, {
                        folder: 'recommendation_media/documents',
                        resource_type: 'raw'
                    });
                    mediaUpdates.documents.push({ url: result.secure_url, public_id: result.public_id });
                }
            }

            if (req.files.videos) {
                for (const file of req.files.videos) {
                    const result = await cloudinary.uploader.upload(file.path, {
                        folder: 'recommendation_media/videos',
                        resource_type: 'video'
                    });
                    mediaUpdates.videos.push({ url: result.secure_url, public_id: result.public_id });
                }
            }

            // Update the recommendation with new details
            const updatedRecommendation = await Recommendation.findByIdAndUpdate(
                recommendationId,
                {
                    category,
                    recommendation,
                    recommendedBy,
                    type,
                    $push: {
                        'relatedMedia.images': { $each: mediaUpdates.images },
                        'relatedMedia.documents': { $each: mediaUpdates.documents },
                        'relatedMedia.videos': { $each: mediaUpdates.videos }
                    }
                },
                { new: true, runValidators: true }
            );

            if (!updatedRecommendation) {
                return res.status(404).json({
                    status: 'error',
                    body: null,
                    message: 'Recommendation not found'
                });
            }

            res.json({
                status: 'success',
                body: updatedRecommendation,
                message: 'Recommendation updated successfully'
            });
        } catch (error) {
            console.error('Error updating recommendation:', error);
            res.status(500).json({
                status: 'error',
                body: null,
                message: 'Error updating recommendation'
            });
        }
    });
};


// Delete a recommendation
const deleteRecommendation = async (req, res) => {
    try {
        const recommendation = await Recommendation.findByIdAndDelete(req.params.id);
        if (!recommendation) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: 'Recommendation not found'
            });
        }

        // Delete media from Cloudinary
        const { relatedMedia } = recommendation;
        const deleteMedia = async (mediaArray) => {
            for (let media of mediaArray) {
                await cloudinary.uploader.destroy(media.public_id);
            }
        };

        await deleteMedia(relatedMedia.images);
        await deleteMedia(relatedMedia.documents);
        await deleteMedia(relatedMedia.videos);

        res.json({
            status: 'success',
            body: null,
            message: 'Recommendation deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: 'Error deleting recommendation'
        });
    }
};



// Fetch Doctor Recommendations by Category
const getDoctorRecommendations = async (req, res) => {
    try {
        const category = req.params.category;

        // Fetch recommendations of type 'doctor' and populate the recommendedBy field with the clinician's details
        const doctorRecommendations = await Recommendation.find({
            category: category,
            type: 'doctor'
        }).populate('recommendedBy'); // Populate with Clinisist data

        if (doctorRecommendations.length === 0) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "No doctor recommendations found for this category"
            });
        }

        // Format the timestamp for each recommendation
        const formattedRecommendations = doctorRecommendations.map(recommendation => {
            const formattedTimestamp = moment(recommendation.timestamp).format('Do MMMM YYYY');
            return {
                ...recommendation.toObject(),
                timestamp: formattedTimestamp
            };
        });

        res.json({
            status: "success",
            body: formattedRecommendations,
            message: "Doctor recommendations retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while retrieving doctor recommendations"
        });
    }
};

// Fetch Portal Recommendations by Category
const getPortalRecommendations = async (req, res) => {
    try {
        const category = req.params.category;
        const portalRecommendations = await Recommendation.find({
            category: category,
            type: 'portal'
        });

        if (portalRecommendations.length === 0) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "No portal recommendations found for this category"
            });
        }

        res.json({
            status: "success",
            body: portalRecommendations,
            message: "Portal recommendations retrieved successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            body: null,
            message: "An error occurred while retrieving portal recommendations"
        });
    }
};


// Create a new recommendation
const createDoctorRecommendation = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading media:', err);
            return res.status(500).json({
                status: 'error',
                body: null,
                message: 'Error uploading media'
            });
        }

        const { category, recommendation, type } = req.body;
        const recommendedBy = req.clinisist._id; // Assuming clinician's ID is stored in req.user._id
        const relatedMedia = {
            images: [],
            documents: [],
            videos: []
        };

        // Process uploaded files and store URLs and public_ids in relatedMedia
        if (req.files.images) {
            req.files.images.forEach(file => {
                relatedMedia.images.push({ url: file.path, public_id: file.filename });
            });
        }
        if (req.files.documents) {
            req.files.documents.forEach(file => {
                relatedMedia.documents.push({ url: file.path, public_id: file.filename });
            });
        }
        if (req.files.videos) {
            req.files.videos.forEach(file => {
                relatedMedia.videos.push({ url: file.path, public_id: file.filename });
            });
        }

        try {
            const newRecommendation = new Recommendation({
                category,
                recommendation,
                relatedMedia,
                recommendedBy,
                type: 'doctor' // Set the type to 'doctor' for clinician recommendations
            });
            await newRecommendation.save();

            res.status(201).json({
                status: 'success',
                body: newRecommendation,
                message: 'Recommendation created successfully'
            });
        } catch (error) {
            console.error('Error creating recommendation:', error);
            res.status(500).json({
                status: 'error',
                body: null,
                message: 'Error creating recommendation'
            });
        }
    });
};


module.exports = {
    createDoctorRecommendation,
    createRecommendation,
    getRecommendations,
    getRecommendationById,
    updateRecommendation,
    deleteRecommendation,
    getDoctorRecommendations,
    getPortalRecommendations
};
