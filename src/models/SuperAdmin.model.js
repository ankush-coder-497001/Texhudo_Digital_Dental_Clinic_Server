const mongoose = require('mongoose');

const superAdminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    profilePicture: { type: String },
    profilePictureId: { type: String }, // Cloudinary public_id
    resetPasswordOTP: {
        code: String,
        expiryTime: Date
    },
    createdAt: { type: Date, default: Date.now }
});

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);
module.exports = SuperAdmin;