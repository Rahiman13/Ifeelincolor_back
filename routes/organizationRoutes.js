const express = require('express');
const { registerOrganization, loginOrganization, getOrganization } = require('../controllers/organizationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Register a new organization
router.post('/register', registerOrganization);

// Login an organization
router.post('/login', loginOrganization);

// Get organization details (requires authentication)
router.get('/me', authMiddleware, getOrganization);

module.exports = router;
