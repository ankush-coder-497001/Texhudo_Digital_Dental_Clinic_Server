const express = require('express');
const router = express.Router();
const  authMiddleware  = require('../middlewares/authMiddleware');
const {
    BookAppointment,
    getMyAppointments,
    getAppointmentDetails,
    getDoctorAppointments,
    updateAppointmentStatus,
    deleteAppointment,
    getDoctorEarnings,
    getEarningsSummary
} = require('../controllers/Appointment.ctrl');

// Regular appointment routes
router.post('/book', authMiddleware, BookAppointment);
router.get('/my-appointments', authMiddleware, getMyAppointments);
router.get('/details/:id', authMiddleware, getAppointmentDetails);
router.get('/doctor/:doctorId', authMiddleware, getDoctorAppointments);
router.put('/status/:id', authMiddleware, updateAppointmentStatus);
router.delete('/:id', authMiddleware, deleteAppointment);

// Financial tracking routes
router.get('/earnings', authMiddleware, getDoctorEarnings);
router.get('/earnings-summary', authMiddleware, getEarningsSummary);

module.exports = router;