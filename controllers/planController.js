const Plan = require('../models/plan');
const Subscription = require('../models/subscription');
const Clinisist = require('../models/Clinisist');
const Patient = require('../models/patient');

const createPlan = async (req, res) => {
    const { name, price, details, validity } = req.body;
    try {
        const plan = new Plan({
            name,
            price,
            details,
            validity,
            createdBy: req.clinisist._id,
            planType: 'doctor-plan' // Set the planType to 'doctor-plan'
        });

        const createdPlan = await plan.save();
        res.status(201).json(createdPlan);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message,
        });
    }
};

const createPortalPlan = async (req, res) => {
    const { name, price, details, validity } = req.body;
    try {
        const plan = new Plan({
            name,  // Use the name provided in the request body
            price,
            details,
            validity,
            createdBy: req.admin._id,
            planType: 'portal-plan'  // Set the planType to 'portal-plan'
        });

        const createdPlan = await plan.save();
        res.status(201).json(createdPlan);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message,
        });
    }
};


const updatePlan = async (req, res) => {
    const {id} = req.params;
    const {name, price, details, validity} = req.body;

    try {
        const plan = await Plan.findById(id);

        if (!plan) {
            return res.status(404).json({
                message: 'Plan not found',
            });
        }
        if (plan.createdBy.toString() !== req.clinisist._id.toString()) {
            return res.status(403).json({
                message: 'NOt authorized to modify this plan',
            });
        }
        
        plan.name = name || plan.name;
        plan.price = price || plan.price;
        plan.details = details || plan.details;
        plan.validity = validity || plan.validity;

        const updatedPlan = await plan.save();

        res.json(updatedPlan);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};


const deletePlan = async (req, res) => {
    try {
        const planId = req.params.id;
        const clinisistId = req.clinisist._id;

        const plan = await Plan.findById(planId);

        if (!plan) {
            return res.status(404).json({
                message: "Plan not found",
            });
        }

        if (plan.createdBy.toString() !== clinisistId.toString()) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        const activeSubscriptions = await Subscription.find({plan: planId});

        if (activeSubscriptions.length > 0) {
            plan.status = 'Inactive';
            await plan.save();
            return res.status(400).json({
                message: 'Cant delete plan with active users',
            });
        }

        await Plan.deleteOne({_id: planId});
        res.json({
            message: 'Plan deleted Sucesfully',
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message,
        });
    }
};

const getPlansByClincist = async (req, res) => {
    try {
        const plans = await Plan.find({createdBy: req.clinisist._id});
        res.json(plans);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        })
    }
};

const showActivePlans = async (req, res) => {
    try {
        const plans = await Plan.find({status: 'Active'});
        res.json(plans);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

const getDoctorPlans = async (req, res) => {
    try {
        const doctorPlans = await Plan.find({ planType: 'doctor-plan', status: 'Active' });
        res.json({
            status: "success",
            body: doctorPlans,
            message: "Doctor plans retrieved successfully"
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};

const getPortalPlans = async (req, res) => {
    try {
        const portalPlans = await Plan.find({ planType: 'portal-plan', status: 'Active' });
        res.json({
            status: "success",
            body: portalPlans,
            message: "Portal plans retrieved successfully"
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            body: null,
            message: err.message
        });
    }
};



module.exports = {createPlan, updatePlan, getPlansByClincist, deletePlan, showActivePlans,createPortalPlan,getDoctorPlans,getPortalPlans};
