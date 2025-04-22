const Appointment = require('../models/Appointment.model');
const Doctor = require('../models/Doctor.model');
const Treatment = require('../models/Treatment.model');

// Function to generate appointment reference token
//Each appointment now gets a unique token in this format: APP-XXXX-YYYY-ZZZZ where:

// XXXX is part of the doctor's ID
// YYYY is based on the appointment date
// ZZZZ is a random string to ensure uniqueness
// When an appointment is booked, the token is automatically generated and returned in the response. The response will look like:
// {
//   "success": true,
//   "appointmentId": "...",
//   "appointmentToken": "APP-1234-5678-ABCD",
//   "message": "Appointment booked successfully"
// }

const generateAppointmentToken = (doctorId, date) => {
  const timestamp = new Date(date).getTime();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `APP-${doctorId.substring(0, 4)}-${timestamp % 10000}-${randomPart}`;
};

exports.BookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, problem, teeth, paymentMode } = req.body;
    const userId = req.user.id;

    // Validate date
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate) || appointmentDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date or date in the past'
      });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM format'
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if the appointment time is available
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      time
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Appointment time is not available'
      });
    }

    // Create appointment
    const appointmentToken = generateAppointmentToken(doctorId, date);
    const appointment = new Appointment({
      patientId: userId,
      doctorId,
      date,
      time,
      problem,
      teeth,
      paymentMode,
      status: 'booked',
      fees: doctor.Fees,
      appointmentToken // Add the reference token
    });
    
    await appointment.save();

    res.status(200).json({
      success: true,
      appointmentId: appointment._id,
      appointmentToken: appointment.appointmentToken,
      message: 'Appointment booked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;
    
    let appointments;
    if (userType === 'doctor') {
      appointments = await Appointment.find({ doctorId: userId })
        .populate('patientId', 'name email phone')
        .sort({ date: -1, time: -1 });
    } else {
      appointments = await Appointment.find({ patientId: userId })
        .populate('doctorId', 'name specialization Fees')
        .sort({ date: -1, time: -1 });
    }

    res.status(200).json({
      success: true,
      appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const appointment = await Appointment.findById(id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization Fees');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user has permission to view this appointment
    if (appointment.patientId._id.toString() !== userId && 
        appointment.doctorId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }

    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'name email phone')
      .sort({ date: -1, time: -1 });

    res.status(200).json({
      success: true,
      appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentReceived } = req.body;
    const userId = req.user.id;

    // Validate status
    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Validate user permission
    if (appointment.doctorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the doctor can update appointment status'
      });
    }

    // Update appointment status
    appointment.status = status;
    appointment.paymentReceived = paymentReceived || false;
    await appointment.save();

    let treatment;
    if (status === 'completed') {
      treatment = new Treatment({
        appointmentId: appointment._id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        treatment: appointment.problem,
        teeth: appointment.teeth,
        notes: 'Treatment completed successfully',
        date: appointment.date,
        fees: appointment.fees,
        paymentReceived: appointment.paymentReceived
      });

      await treatment.save();
    }

    res.status(200).json({
      success: true,
      appointment,
      message: 'Appointment status updated successfully',
      treatment: treatment ? treatment : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.user.type;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Only allow cancellation if appointment is not completed or cancelled
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${appointment.status} appointment`
      });
    }

    // Check authorization
    if (userType === 'user' && appointment.patientId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this appointment'
      });
    }

    if (userType === 'doctor' && appointment.doctorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this appointment'
      });
    }

    await Appointment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Financial tracking routes for doctors
exports.getDoctorEarnings = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { startDate, endDate, status } = req.query;

    const query = {
      doctorId,
      status: status || 'completed'
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const appointments = await Appointment.find(query);

    const totalEarnings = appointments.reduce((sum, app) => sum + (app.fees || 0), 0);
    const receivedPayments = appointments.filter(app => app.paymentReceived).reduce((sum, app) => sum + (app.fees || 0), 0);
    const pendingPayments = totalEarnings - receivedPayments;

    res.status(200).json({
      success: true,
      statistics: {
        totalAppointments: appointments.length,
        totalEarnings,
        receivedPayments,
        pendingPayments,
        appointments: appointments.map(app => ({
          id: app._id,
          date: app.date,
          fees: app.fees,
          paymentReceived: app.paymentReceived,
          status: app.status
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getEarningsSummary = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { period } = req.query; // daily, weekly, monthly, yearly

    const now = new Date();
    let startDate;

    switch (period) {
      case 'daily':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'yearly':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1)); // Default to monthly
    }

    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: startDate },
      status: 'completed'
    });

    const summary = appointments.reduce((acc, app) => {
      const date = new Date(app.date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          totalEarnings: 0,
          appointmentsCount: 0,
          receivedPayments: 0,
          pendingPayments: 0
        };
      }
      acc[date].totalEarnings += app.fees || 0;
      acc[date].appointmentsCount += 1;
      if (app.paymentReceived) {
        acc[date].receivedPayments += app.fees || 0;
      } else {
        acc[date].pendingPayments += app.fees || 0;
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      period,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};