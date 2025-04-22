const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  problem: { type: String, required: true },
  teeth: [Number],
  status: { 
    type: String, 
    enum: ['booked', 'confirmed', 'completed', 'cancelled'], 
    default: 'booked' 
  },
  fees: { type: Number, required: true }, // Doctor's consultation fees
  paymentReceived: { type: Boolean, default: false }, // Track if payment was received at clinic
  paymentDate: { type: Date }, // Date when payment was received
  paymentMode: { type: String, enum: ['cash', 'card', 'upi', 'other'], default: 'cash' }, // Mode of payment at clinic
  paymentNotes: { type: String }, // Any additional notes about payment
  appointmentToken: {
    type: String,
    unique: true,
    required: true
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Add indexes for better query performance on financial reports
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, paymentReceived: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;