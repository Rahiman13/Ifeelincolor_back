const Subscription = require('../models/subscription');
const Plan = require('../models/plan');
const createNotification = require('../utils/createNotification');
const Clinisist = require('../models/Clinisist');
const patient = require('../models/patient');
const createSubscription = async (req, res) => {
    const { planId } = req.params;

    try {
        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({
                status: 'error',
                body: null,
                message: "Plan not found"
            });
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.validity);

        // Determine the clinisist ID based on the plan type
        let clinisistId = null;
        if (plan.planType === 'doctor-plan') {
            clinisistId = plan.createdBy; // Assuming `createdBy` is the clinician's ID
        }

        const subscription = new Subscription({
            patient: req.patient._id,
            plan: planId,
            clinisist: clinisistId,
            startDate,
            endDate,
        });

        const createdSubscription = await subscription.save();

        // Notify the patient
        const patientMessage = `You have successfully subscribed to the plan "${plan.name}".`;
        await createNotification(req.patient._id, 'Patient', patientMessage, null, null, 'subscription');

        // Notify the clinician (if applicable)
        if (clinisistId) {
            const clinician = await Clinisist.findById(clinisistId);
            if (clinician) {
                const clinicianMessage = `A new patient has subscribed to your plan "${plan.name}".`;
                await createNotification(clinician._id, 'Clinisist', clinicianMessage, req.patient._id, 'Patient', 'subscription');
            }
        }

        res.status(201).json({
            status: 'success',
            body: createdSubscription,
            message: 'Subscription created successfully'
        });

    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};

const getSubscriptionByPatient = async (req, res) => {
    try {
        // Find subscriptions for the patient
        const subscriptions = await Subscription.find({ patient: req.patient._id })
            .populate({
                path: 'plan',
                populate: {
                    path: 'createdBy', // Populate the clinician info from the plan
                    model: 'Clinisist'
                }
            });

        // Map through subscriptions to conditionally include clinician name
        const subscriptionsWithOptionalClinicianName = subscriptions.map(sub => {
            if (sub.plan.type === 'doctor-plan' && sub.plan.createdBy) {
                // Add clinician name only if the plan type is 'doctor-plan'
                return {
                    ...sub.toObject(), // Spread the subscription object
                    clinicianName: sub.plan.createdBy ? sub.plan.createdBy.name : null // Add clinician name
                };
            } else {
                // Return subscription without clinician name if plan type is not 'doctor-plan'
                return {
                    ...sub.toObject(), // Spread the subscription object
                    clinicianName: null // No clinician name for non 'doctor-plan'
                };
            }
        });

        res.json({
            status: "success",
            body: subscriptionsWithOptionalClinicianName,
            message: "Subscriptions retrieved successfully"
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

const getSubscribedClinicians = async (req, res) => {
    try {
        // Fetch subscriptions for the patient and populate the plan field
        const subscriptions = await Subscription.find({ patient: req.patient._id }).populate('plan');

        // Map to store clinicians with their corresponding subscribed plans
        const clinicianSubscriptions = {};

        subscriptions.forEach(sub => {
            const clinicianId = sub.plan.createdBy.toString();
            if (!clinicianSubscriptions[clinicianId]) {
                clinicianSubscriptions[clinicianId] = {
                    clinician: null,
                    plans: []
                };
            }
            clinicianSubscriptions[clinicianId].plans.push(sub.plan);
        });

        // Fetch the clinician details
        const clinicianIds = Object.keys(clinicianSubscriptions);
        const clinicians = await Clinisist.find({ _id: { $in: clinicianIds } });

        // Attach the clinician details to the corresponding subscriptions
        clinicians.forEach(clinician => {
            const clinicianId = clinician._id.toString();
            if (clinicianSubscriptions[clinicianId]) {
                clinicianSubscriptions[clinicianId].clinician = clinician;
            }
        });

        // Prepare the response array
        const response = Object.values(clinicianSubscriptions).map(item => ({
            clinician: item.clinician,
            subscribedPlans: item.plans
        }));

        res.json({
            status: 'success',
            body: response,
            message: 'Subscribed clinicians retrieved successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            body: null,
            message: err.message
        });
    }
};



module.exports = {createSubscription, getSubscriptionByPatient, getSubscribedClinicians};