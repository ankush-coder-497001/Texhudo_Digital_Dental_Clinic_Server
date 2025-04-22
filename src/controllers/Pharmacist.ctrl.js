const Pharmacist = require('../models/Pharmacist.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { welcomeMessege, SendOTP, ForgotPasswordSuccessMessage } = require('../services/emailService');
const { uploadImage, deleteImage } = require('../services/cloudinaryService');

exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, licenseNumber } = req.body;

        const existingPharmacist = await Pharmacist.findOne({ email });
        if (existingPharmacist) {
            return res.status(400).json({ message: 'Pharmacist already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const pharmacist = new Pharmacist({
            name,
            email,
            password: hashedPassword,
            phone,
            licenseNumber
        });

        await pharmacist.save();
        await welcomeMessege(email);

        res.status(201).json({ message: 'Pharmacist registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const pharmacist = await Pharmacist.findOne({ email });
        if (!pharmacist) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, pharmacist.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: pharmacist._id, type: 'pharmacist' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_SECRET_EXPIRY }
        );

        res.json({
            token,
            pharmacist: {
                id: pharmacist._id,
                name: pharmacist.name,
                email: pharmacist.email,
                phone: pharmacist.phone,
                licenseNumber: pharmacist.licenseNumber
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const pharmacist = await Pharmacist.findById(req.user.id).select('-password');
        if (!pharmacist) {
            return res.status(404).json({ message: 'Pharmacist not found' });
        }
        res.json(pharmacist);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const pharmacist = await Pharmacist.findById(req.user.id);
        
        if (!pharmacist) {
            return res.status(404).json({ message: 'Pharmacist not found' });
        }

        if (name) pharmacist.name = name;
        if (phone) pharmacist.phone = phone;

        await pharmacist.save();
        res.json({ message: 'Profile updated successfully', pharmacist });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.SendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const pharmacist = await Pharmacist.findOne({ email });

        if (!pharmacist) {
            return res.status(404).json({ message: 'Pharmacist not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

        pharmacist.resetPasswordOTP = {
            code: otp,
            expiryTime: otpExpiry
        };
        await pharmacist.save();

        await SendOTP(email, otp);

        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.forgetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const pharmacist = await Pharmacist.findOne({ email });

        if (!pharmacist) {
            return res.status(404).json({ message: 'Pharmacist not found' });
        }

        if (!pharmacist.resetPasswordOTP || 
            pharmacist.resetPasswordOTP.code !== otp || 
            pharmacist.resetPasswordOTP.expiryTime < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        pharmacist.password = hashedPassword;
        pharmacist.resetPasswordOTP = undefined;
        await pharmacist.save();

        await ForgotPasswordSuccessMessage(email);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image'
            });
        }

        const pharmacist = await Pharmacist.findById(req.user.id);
        if (!pharmacist) {
            return res.status(404).json({
                success: false,
                message: 'Pharmacist not found'
            });
        }

        // Delete old profile picture if exists
        if (pharmacist.profilePictureId) {
            await deleteImage(pharmacist.profilePictureId);
        }

        // Upload new image
        const result = await uploadImage(req.file, 'pharmacists');
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Error uploading image'
            });
        }

        // Update pharmacist profile
        pharmacist.profilePicture = result.url;
        pharmacist.profilePictureId = result.publicId;
        await pharmacist.save();

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            profilePicture: pharmacist.profilePicture
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};