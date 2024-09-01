const express = require('express');
const router = express.Router();
const {authenticateOrgAdmin, authOrganization} = require('../middleware/auth');
const {
    registerOrgAdmin,
    loginOrgAdmin,
    getOrgAdminDetails,
    updateOrgAdmin,
    deleteOrgAdmin
} = require('../controllers/orgAdminController');

// Route to register a new OrgAdmin
router.post('/register',authOrganization, registerOrgAdmin);

// Route to login an existing OrgAdmin
router.post('/login', loginOrgAdmin);

// Route to get OrgAdmin details (requires authentication)
router.get('/me', authenticateOrgAdmin, getOrgAdminDetails);

// Route to update OrgAdmin details (requires authentication)
router.put('/me', authenticateOrgAdmin, updateOrgAdmin);

// Route to delete an OrgAdmin (requires authentication)
router.delete('/me', authenticateOrgAdmin, deleteOrgAdmin);

module.exports = router;
