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
  payment: {
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
    method: { type: String, enum: ['online', 'clinic', 'none'], default: 'none' },
    paymentIntentId: String,
    receiptUrl: String,
    transferId: String,
    transferStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    transferError: String
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;