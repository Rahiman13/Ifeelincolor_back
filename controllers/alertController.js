const Alert = require('../models/alert');
const Clinisist = require('../models/Clinisist');
const calculateDistance = require('../utils/calculateDistance');

const createAlert = async (req, res) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({
            status: "error",
            body: null,
            message: "Latitude and longitude are required"
        });
    }

    try {
        // Extract patient details from the token (assuming `req.patient` is populated by the authentication middleware)
        const patient_mobile_num = req.patient.mobile;
        const patient_name = req.patient.userName;
        const patient_location = { latitude, longitude };

        // Find all clinicians
        const clinisists = await Clinisist.find({});

        if (clinisists.length === 0) {
            return res.status(404).json({
                status: "error",
                body: null,
                message: "No clinicians found"
            });
        }

        // Calculate distance for each clinician
        const distances = clinisists.map(clinisist => ({
            clinisist,
            distance: calculateDistance(latitude, longitude, clinisist.address.latitude, clinisist.address.longitude)
        }));

        // Find the nearest clinician(s)
        const minDistance = Math.min(...distances.map(d => d.distance));
        const nearestClinisists = distances.filter(d => d.distance === minDistance);

        // Choose one clinician randomly if there are multiple with the same distance
        const nearest = nearestClinisists[Math.floor(Math.random() * nearestClinisists.length)];

        // Populate the alert data
        const newAlert = new Alert({
            patient_name,
            patient_mobile_num,
            patient_location,
            distance: nearest.distance.toFixed(2), // Round to 2 decimal places
            nearest_clinisist_name: nearest.clinisist.name,
            nearest_clinisist_id: nearest.clinisist._id,
            nearest_clinisist_location: {
                latitude: nearest.clinisist.address.latitude,
                longitude: nearest.clinisist.address.longitude
            }
        });

        // Save the alert to the database
        await newAlert.save();

        res.status(201).json({
            status: "success",
            body: newAlert,
            message: "Alert created successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

module.exports = {
    createAlert
};
