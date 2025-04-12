const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const AppointmentController = require('../controllers/Appointment.ctrl');

router.post('/book', auth, AppointmentController.BookAppointment);
router.get('/my-appointments', auth, AppointmentController.getMyAppointments);
router.get('/:id', auth, AppointmentController.getAppointmentDetails);
router.get('/doctor/:doctorId', auth(['doctor']), AppointmentController.getDoctorAppointments);
router.put('/update/:id', auth, AppointmentController.updateAppointmentStatus);
router.delete('/delete/:id', auth, AppointmentController.deleteAppointment);

module.exports = router;