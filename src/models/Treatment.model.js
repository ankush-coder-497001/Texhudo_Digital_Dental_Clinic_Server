const mongoose = require('mongoose');
const treatmentSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  treatment: { type: String, required: true }, // e.g., "Filling", "Cleaning"
  teeth: [Number], // Teeth involved in treatment
  notes: String,
  date: { type: Date, default: Date.now }
});

const Treatment = mongoose.model('Treatment', treatmentSchema);
module.exports = Treatment;