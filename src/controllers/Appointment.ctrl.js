const { createPaymentIntent } = require('../services/paymentService');
const Appointment = require('../models/Appointment.model');
const Doctor = require('../models/Doctor.model');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.BookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, problem, teeth, amount ,method  } = req.body;
    const userId = req.user.id;

    const doctor = await Doctor.findById(doctorId);
    //check if the doctor is available
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

    // Check if the user has already booked an appointment with the same doctor
    const existingUserAppointment = await Appointment.findOne({
      patientId: userId,
      doctorId
    });
    if (existingUserAppointment) {
      return res.status(400).json({
        success: false,
        message: 'You have already booked an appointment with this doctor'
      });
    }

    // Check if the amount is valid
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Check if the amount is exactly the same as the doctor's fee
    if (amount !== doctor.Fees) {
      return res.status(400).json({
        success: false,
        message: 'Amount does not match the doctor\'s fee'
      });
    }

    let appointment;
    
    if(method === 'online') {
    // Create a payment intent
    const paymentIntent = await createPaymentIntent(amount);

    // Create appointment with payment details
     appointment = new Appointment({
      patientId: userId,
      doctorId,
      date,
      time,
      problem,
      teeth,
      payment: {
        amount,
        status: 'pending',
        method: 'online',
        paymentIntentId: paymentIntent.id
      }
    });
    await appointment.save();

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      appointmentId: appointment._id
    });
    }

      // Create appointment without payment details
      appointment = new Appointment({
        patientId: userId,
        doctorId,
        date,
        time,
        problem,
        teeth,
        payment: {
          amount,
          status: 'pending',
          method: 'clinic'
        }
      });
      await appointment.save();

      res.status(200).json({
        success: true,
        appointmentId: appointment._id
      });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add a webhook handler for successful payments
exports.handlePaymentSuccess = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {

    //verify the webhook signature
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    // Handle the event

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Get the charge to access the receipt URL
      const charges = await stripe.charges.list({
        payment_intent: paymentIntent.id
      });
      const charge = charges.data[0];
      
      // Update appointment with payment confirmation and receipt
      const appointment = await Appointment.findOne({
        'payment.paymentIntentId': paymentIntent.id 
      });
      
      if (appointment) {
        appointment.status = 'confirmed';
        appointment.payment.status = 'paid';
        appointment.payment.receiptUrl = charge.receipt_url;
        await appointment.save();
      }
    }

    res.json({ received: true });
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
    const { status } = req.body;

    // Validate status
    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
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
}

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

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
}