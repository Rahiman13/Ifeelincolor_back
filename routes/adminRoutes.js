const express = require('express');
const Admin = require('../models/admin');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const {adminAuth} = require('../middleware/adminAuth');
const Patient = require('../models/patient');
const { updateAdminName, updateAdminPassword } = require('../controllers/adminController');
const Clinisist = require('../models/Clinisist');
const {createPortalPlan} = require('../controllers/planController');
require('../config/passport');

router.post('/register', async (req, res) => {
    const {name, email, password} = req.body;

    try {
        const adminExists = await Admin.findOne({ email });

        if (adminExists) {
            return res.status(400).json({
                messge: 'Admin already exists',
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await Admin.create({
            name,
            email,
            password: hashedPassword,
        });

        if (admin) {
            res.status(201).json({
                id: admin._id,
                name: admin.name,
                email: admin.email,
                token: jwt.sign({ id: admin._id}, process.env.JWT_SECRET, {
                    expiresIn: '1d',
                }),
            });
        } else {
            res.status(400).json({
                message: 'Invalid admin data'
            });
        }
    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            message: err.message,
        });
    }
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, admin, info) => {
        if (err) {
            return next(err);
        }
        if (!admin) {
            return res.status(400).json({
                message: 'Invalid Credentials',
            });
        }
        req.login(admin, {session: false}, (err) => {
            if (err) {
                return next(err);
            }
            const token = jwt.sign({id: admin._id}, process.env.JWT_SECRET, {
                expiresIn: '1d',
            });

            return res.json({token});
        });
    })(req, res, next);
});

router.route('/get-patients').get(adminAuth, async (req, res) => {
    const patients = await Patient.find();
    return res.status(200).json({patients});
});
router.route('/get-doctors').get(adminAuth, async (req, res) => {
    const clinisists = await Clinisist.find();
    return res.status(200).json({clinisists});
});

// Updated route to verify a clinician using PUT
router.route('/verify-doctor/:id').put(adminAuth, async (req, res) => {
    try {
        const clinicianId = req.params.id;
        
        const clinician = await Clinisist.findById(clinicianId);
        
        if (!clinician) {
            return res.status(404).json({ message: 'Clinician not found' });
        }
        clinician.verified = 'yes';
        const updatedClinician = await clinician.save();
        
        res.status(200).json({ 
            message: 'Clinician verified successfully',
            clinician: updatedClinician
        });
    } catch (error) {
        console.error('Error verifying clinician:', error);
        res.status(500).json({ message: 'Error verifying clinician', error: error.message });
    }
});


router.route('/update-name').patch(adminAuth, updateAdminName);
router.route('update-password').patch(adminAuth, updateAdminPassword);
router.route('/portal-plan').post(adminAuth, createPortalPlan);
module.exports = router;