const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/Doctor.ctrl');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.post('/register', doctorController.register);
router.post('/login', doctorController.login);
router.post('/Send-OTP', doctorController.SendOTP);
router.post('/forget-password', doctorController.forgetPassword);

// Protected routes
router.get('/profile', authMiddleware(['doctor']), doctorController.getProfile);
router.put('/profile', authMiddleware(['doctor']), doctorController.updateProfile);
router.post('/reset-password', authMiddleware(['doctor']), doctorController.resetPassword);
router.post('/profile-picture', authMiddleware(['doctor']), upload.single('image'), doctorController.uploadProfilePicture);

module.exports = router;