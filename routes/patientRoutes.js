const express = require('express');
const {deletePatientImage,getAllClinisists,getClinisistById,getPatientProfile, updatePassword, updateUserName, deletePatient,getNearestDoctors,updatePatient,getNotifications} = require('../controllers/patientController');
const {patientProtect} = require('../middleware/auth');
const {showActivePlans, getDoctorPlans, getPortalPlans} = require('../controllers/planController');
const { createSubscription, getSubscriptionByPatient, getSubscribedClinicians } = require('../controllers/subscriptionController');
const router = express.Router();
const {changePassword,createOrUpdatePatientAnswers, getFixedQuestions, getPatientInfo} = require('../controllers/patientInfoController');
const { createAlert } = require('../controllers/alertController');

router.route('/profile').get(patientProtect, getPatientProfile);
router.route('/profile/update-password').patch(patientProtect, updatePassword);
router.route('/profile/update-username').patch(patientProtect, updateUserName);
router.route('/profile/delete').delete(patientProtect, deletePatient);
router.route('/profile/delete-dp').delete(patientProtect, deletePatientImage);
router.route('/profile/my-subscriptions').get(patientProtect, getSubscriptionByPatient);
router.route('/subscribe-to/:planId').post(patientProtect, createSubscription);
router.route('/all-active-plans').get(patientProtect,showActivePlans);
router.route('/list-doctor-plans').get(getDoctorPlans);
router.route('/get-doctors').get(getAllClinisists);
router.route('/get-doctor/:id').get(getClinisistById);
router.route('/list-portal-plans').get(getPortalPlans);
router.route('/get-nearest-doctors').post(patientProtect,getNearestDoctors);
router.route('/updatePatient').put(patientProtect,updatePatient);
router.route('/notifications').get(patientProtect,getNotifications);
//router.route('/update-dp/:id').put(patientProtect, upload.single('image'), updatePatientImage);
router.route('/update-history').put(patientProtect,createOrUpdatePatientAnswers);
router.get('/history', getFixedQuestions);
router.get('/info',patientProtect, getPatientInfo);
router.get('/subscribed-doctors', patientProtect, getSubscribedClinicians);
router.post('/alert', patientProtect, createAlert);
router.put('/change-password', patientProtect, changePassword);


module.exports = router;