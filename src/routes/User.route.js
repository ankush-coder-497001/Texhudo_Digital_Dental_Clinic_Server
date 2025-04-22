const express = require('express');
const router = express.Router();
const userController = require('../controllers/User.ctrl');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/Send-OTP', userController.SendOTP);
router.post('/forget-password', userController.forgetPassword);

// Protected routes
router.get('/profile', authMiddleware(['user']), userController.getProfile);
router.put('/profile', authMiddleware(['user']), userController.updateProfile);
router.post('/reset-password', authMiddleware(['user']), userController.resetPassword);
router.post('/profile-picture', authMiddleware(['user']), upload.single('image'), userController.uploadProfilePicture);

module.exports = router;