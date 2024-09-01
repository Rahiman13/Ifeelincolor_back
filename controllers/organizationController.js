const Organization = require('../models/organization');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createNotification = require('../utils/createNotification'); // Import the notification helper
const sendEmail = require('../utils/mailUtil'); // Import the mail utility

const registerOrganization = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if the organization already exists
        const existingOrg = await Organization.findOne({ email });
        if (existingOrg) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Organization already exists'
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new organization
        const newOrg = new Organization({
            name,
            email,
            password: hashedPassword,
        });

        await newOrg.save();

        // Create a notification for the newly registered organization
        await createNotification(
            newOrg._id,               
            'Organization',           
            'Your organization has been successfully registered.', 
            null,                     
            null,                     
            'message'                 
        );

        // Send a welcome email to the newly registered organization
        await sendEmail(
            email,
            'Welcome to Our Platform',
            `Hello ${name},\n\nYour organization has been successfully registered.\n\nThank you for joining us!\n\nBest Regards,\nYour Company Name`
        );

        // Respond with the new organization data
        res.status(201).json({
            status: 'success',
            body: newOrg,
            message: 'Organization registered successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};



// Authenticate an Organization
const loginOrganization = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the organization exists
        const organization = await Organization.findOne({ email });
        if (!organization) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid email or password'
            });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, organization.password);
        if (!isMatch) {
            return res.status(400).json({
                status: 'error',
                body: null,
                message: 'Invalid email or password'
            });
        }

        // Create and return a JWT token
        const token = jwt.sign(
            { organization: { id: organization._id, name: organization.name } },
            process.env.JWT_SECRET,
        );

        res.json({
            status: 'success',
            body: { 
                organization : {
                    id : organization._id,
                    name : organization.name,
                    email : organization.email,
                    token
                }
             },
            message: 'Organization authenticated successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

// Get Organization details
const getOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.organization.id).select('-password');
        res.json({
            status: 'success',
            body: organization,
            message: 'Organization details retrieved successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

module.exports = {
    registerOrganization,
    loginOrganization,
    getOrganization,
};
