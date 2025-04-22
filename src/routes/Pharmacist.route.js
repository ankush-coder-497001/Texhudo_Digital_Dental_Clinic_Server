const express = require('express');
const router = express.Router();
const pharmacistController = require('../controllers/Pharmacist.ctrl');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.post('/register', pharmacistController.register);
router.post('/login', pharmacistController.login);
router.post('/Send-OTP', pharmacistController.SendOTP);
router.post('/forget-password', pharmacistController.forgetPassword);

// Protected routes
router.get('/profile', authMiddleware(['pharmacist']), pharmacistController.getProfile);
router.put('/profile', authMiddleware(['pharmacist']), pharmacistController.updateProfile);
router.post('/profile-picture', authMiddleware(['pharmacist']), upload.single('image'), pharmacistController.uploadProfilePicture);

module.exports = router;