const Doctor = require('../models/Doctor.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { welcomeMessege, SendOTP, ForgotPasswordSuccessMessage } = require('../services/emailService');
const { createConnectedAccount, createAccountLink, getAccountStatus } = require('../services/paymentService');

// Register new doctor
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, specialization, availableDays, availableHours ,Fees } = req.body;

        // Check if doctor exists
        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({ message: 'Doctor already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new doctor
        const doctor = new Doctor({
            name,
            email,
            password: hashedPassword,
            phone,
            specialization,
            availableDays,
            availableHours,
            Fees
        });

        await doctor.save();

        // Send welcome email
        await welcomeMessege(email);

        res.status(201).json({ message: 'Doctor registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login doctor
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if doctor exists
        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: doctor._id, type: 'doctor' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_SECRET_EXPIRY }
        );

        res.json({
            token,
            doctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                phone: doctor.phone,
                specialization: doctor.specialization,
                availableDays: doctor.availableDays,
                availableHours: doctor.availableHours
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get doctor profile
exports.getProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user.id).select('-password');
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update doctor profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, specialization, availableDays, availableHours ,Fees } = req.body;
        const doctor = await Doctor.findById(req.user.id);
        
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        if (name) doctor.name = name;
        if (phone) doctor.phone = phone;
        if (specialization) doctor.specialization = specialization;
        if (availableDays) doctor.availableDays = availableDays;
        if (availableHours) doctor.availableHours = availableHours;
        if (Fees) doctor.Fees = Fees;

        await doctor.save();
        res.json({ message: 'Profile updated successfully', doctor });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Forgot password - send OTP
exports.SendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const doctor = await Doctor.findOne({ email });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

        // Save OTP to doctor document
        doctor.resetPasswordOTP = {
            code: otp,
            expiryTime: otpExpiry
        };
        await doctor.save();

        // Send OTP via email
        await SendOTP(email, otp);

        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Verify OTP and reset password
exports.forgetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const doctor = await Doctor.findOne({ email });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Verify OTP
        if (!doctor.resetPasswordOTP || 
            doctor.resetPasswordOTP.code !== otp || 
            doctor.resetPasswordOTP.expiryTime < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password and clear OTP
        doctor.password = hashedPassword;
        doctor.resetPasswordOTP = undefined;
        await doctor.save();

        // Send success email
        await ForgotPasswordSuccessMessage(email);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const doctor = await Doctor.findById(req.user.id);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, doctor.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password
        doctor.password = hashedPassword;
        await doctor.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Set up Stripe Connect account
exports.setupStripeAccount = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        if (!doctor.stripeAccountId) {
            // Create a new Stripe Connect account
            const account = await createConnectedAccount(doctor.email);
            doctor.stripeAccountId = account.id;
            await doctor.save();
        }

        // Create an account link for onboarding
        const accountLink = await createAccountLink(doctor.stripeAccountId);
        
        res.json({ url: accountLink.url });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Check Stripe account status
exports.getStripeAccountStatus = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user.id);
        if (!doctor || !doctor.stripeAccountId) {
            return res.status(404).json({ message: 'Stripe account not found' });
        }

        const status = await getAccountStatus(doctor.stripeAccountId);
        doctor.payoutEnabled = status.payoutsEnabled;
        await doctor.save();

        res.json(status);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
