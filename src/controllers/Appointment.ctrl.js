const { createPaymentIntent } = require('../services/paymentService');
const Appointment = require('../models/Appointment.model');
const Doctor = require('../models/Doctor.model');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Treatment = require('../models/Treatment.model');
const Payment = require('../models/Payment.model');
exports.BookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, problem, teeth, amount, method } = req.body;
    const userId = req.user.id;

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
    
    if (method === 'online') {
      // Check if doctor has set up their Stripe account
      if (!doctor.stripeAccountId || !doctor.payoutEnabled) {
        return res.status(400).json({
          success: false,
          message: 'Doctor has not set up their payment account yet'
        });
      }

      // Create a payment intent with automatic transfer to doctor's account
      const paymentIntent = await createPaymentIntent(amount, doctor.stripeAccountId);

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
    } else {
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
    }
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

    switch (event.type) {
      case 'payment_intent.succeeded':
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
        break;

      case 'transfer.paid':
        const transfer = event.data.object;
        // Update appointment to reflect successful transfer to doctor
        const transferAppointment = await Appointment.findOne({
          'payment.paymentIntentId': transfer.source_transaction
        });
        
        if (transferAppointment) {
          transferAppointment.payment.transferStatus = 'completed';
          transferAppointment.payment.transferId = transfer.id;
          await transferAppointment.save();
        }
        break;

      case 'transfer.failed':
        const failedTransfer = event.data.object;
        // Update appointment to reflect failed transfer
        const failedAppointment = await Appointment.findOne({
          'payment.paymentIntentId': failedTransfer.source_transaction
        });
        
        if (failedAppointment) {
          failedAppointment.payment.transferStatus = 'failed';
          failedAppointment.payment.transferError = failedTransfer.failure_message;
          await failedAppointment.save();
        }
        break;
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
   let treatment ; 
    if(appointment.status === 'completed') {
      //create a treatment 
        treatment = new Treatment({
        appointmentId: appointment._id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        treatment: appointment?.problem, // e.g., "Filling", "Cleaning"
        teeth: appointment.teeth, // Teeth involved in treatment
        notes: 'Treatment completed successfully',
        date: appointment.date
      });

      await treatment.save();
      //create a payment 
      const payment = new Payment({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        amount: appointment.payment.amount,
        status: 'paid',
        paymentMethod: appointment.payment.method,
        transactionId: appointment.payment.paymentIntentId,
        receiptUrl: appointment.payment.receiptUrl
      });
      await payment.save();

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