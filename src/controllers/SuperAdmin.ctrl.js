const SuperAdmin = require('../models/SuperAdmin.model');
const User = require('../models/User.model');
const Doctor = require('../models/Doctor.model');
const Pharmacist = require('../models/Pharmacist.model');
const MedicineSale = require('../models/MedicineSale.model');
const Appointment = require('../models/Appointment.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { welcomeMessege, SendOTP, ForgotPasswordSuccessMessage } = require('../services/emailService');
const { uploadImage, deleteImage } = require('../services/cloudinaryService');

// Authentication
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await SuperAdmin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        const token = jwt.sign(
            { id: admin._id, type: 'superadmin' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_SECRET_EXPIRY }
        );

        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const usersCount = await User.countDocuments();
        const doctorsCount = await Doctor.countDocuments();
        const pharmacistsCount = await Pharmacist.countDocuments();
        const appointmentsCount = await Appointment.countDocuments();

        const recentAppointments = await Appointment.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('patientId', 'name')
            .populate('doctorId', 'name');

        const recentSales = await MedicineSale.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('patient', 'name')
            .populate('soldBy', 'name');

        // Calculate total revenue and profit
        const sales = await MedicineSale.find();
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

        // Get appointments by status
        const appointmentsByStatus = await Appointment.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                counts: {
                    users: usersCount,
                    doctors: doctorsCount,
                    pharmacists: pharmacistsCount,
                    appointments: appointmentsCount
                },
                financial: {
                    totalRevenue,
                    totalProfit
                },
                appointmentsByStatus,
                recentAppointments,
                recentSales
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// User Management
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ 
            success: true,
            users 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find().select('-password');
        res.json({ 
            success: true,
            doctors 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

exports.getAllPharmacists = async (req, res) => {
    try {
        const pharmacists = await Pharmacist.find().select('-password');
        res.json({ 
            success: true,
            pharmacists 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Account Management
exports.toggleUserAccess = async (req, res) => {
    try {
        const { userId, userType, action } = req.body;
        let user;

        switch (userType) {
            case 'user':
                user = await User.findById(userId);
                break;
            case 'doctor':
                user = await Doctor.findById(userId);
                break;
            case 'pharmacist':
                user = await Pharmacist.findById(userId);
                break;
            default:
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid user type' 
                });
        }

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        if (action === 'disable') {
            user.isActive = false;
        } else if (action === 'enable') {
            user.isActive = true;
        }

        await user.save();
        res.json({ 
            success: true,
            message: `User ${action}d successfully`,
            user 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Financial Reports
exports.getFinancialReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {};
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Medicine sales
        const medicineSales = await MedicineSale.find(query);
        const medicineRevenue = medicineSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const medicineProfit = medicineSales.reduce((sum, sale) => sum + sale.profit, 0);

        // Appointment revenue
        const appointments = await Appointment.find({
            ...query,
            'payment.status': 'paid'
        });
        const appointmentRevenue = appointments.reduce((sum, apt) => sum + apt.payment.amount, 0);

        res.json({
            success: true,
            report: {
                medicineSales: {
                    count: medicineSales.length,
                    revenue: medicineRevenue,
                    profit: medicineProfit
                },
                appointments: {
                    count: appointments.length,
                    revenue: appointmentRevenue
                },
                total: {
                    revenue: medicineRevenue + appointmentRevenue,
                    profit: medicineProfit + (appointmentRevenue * 0.1) // Assuming 10% profit margin on appointments
                }
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
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

        const admin = await SuperAdmin.findById(req.user.id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Delete old profile picture if exists
        if (admin.profilePictureId) {
            await deleteImage(admin.profilePictureId);
        }

        // Upload new image
        const result = await uploadImage(req.file, 'admins');
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Error uploading image'
            });
        }

        // Update admin profile
        admin.profilePicture = result.url;
        admin.profilePictureId = result.publicId;
        await admin.save();

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            profilePicture: admin.profilePicture
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};