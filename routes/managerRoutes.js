const express = require('express');
const router = express.Router();
const {authenticateManager, authOrganization} = require('../middleware/auth');

const {
    registerManager,
    loginManager,
    getManagerDetails,
    updateManager,
    deleteManager
} = require('../controllers/managerController');

// Route to register a new Manager
router.post('/register',authOrganization, registerManager);

// Route to login an existing Manager
router.post('/login', loginManager);

// Route to get Manager details (requires authentication)
router.get('/me', authenticateManager, getManagerDetails);

// Route to update Manager details (requires authentication)
router.put('/me', authenticateManager, updateManager);

// Route to delete a Manager (requires authentication)
router.delete('/me', authenticateManager, deleteManager);

module.exports = router;
