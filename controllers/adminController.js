const Admin = require('../models/admin');
const bcrypt = require('bcryptjs');

const updateAdminName = async(req, res) => {
    const {newName} = req.body;

    try {
        const admin = await Admin.findById(req.admin._id);

        if (admin) {
            admin.name = newName;
            await admin.save();
            res.json({
                message: 'Name updated sucessfully',
            });
        } else {
            res.status(404).json({
                message: 'Admin not found',
            });
        }
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

const updateAdminPassword = async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    try {
        const admin = await Admin.findById(req.admin._id);

        if (admin && (await bcrypt.compare(oldPassword, admin.password))) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(newPassword, salt);
            await admin.save();
            res.json({
                message: "Password changed sucessfully",
            });
        } else {
            res.status(401).json({
                message: 'Old password is incorrect',
            });
        }
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

module.exports = {updateAdminName, updateAdminPassword};