const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/SuperAdmin.ctrl');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Authentication
router.post('/login', superAdminController.login);

// Protected routes - all require superadmin authentication
router.get('/dashboard', authMiddleware(['superadmin']), superAdminController.getDashboardStats);
router.get('/users', authMiddleware(['superadmin']), superAdminController.getAllUsers);
router.get('/doctors', authMiddleware(['superadmin']), superAdminController.getAllDoctors);
router.get('/pharmacists', authMiddleware(['superadmin']), superAdminController.getAllPharmacists);
router.post('/toggle-access', authMiddleware(['superadmin']), superAdminController.toggleUserAccess);
router.get('/financial-report', authMiddleware(['superadmin']), superAdminController.getFinancialReport);
router.post('/profile-picture', authMiddleware(['superadmin']), upload.single('image'), superAdminController.uploadProfilePicture);

module.exports = router;