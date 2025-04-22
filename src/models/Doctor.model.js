const mongoose = require('mongoose');
const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  specialization: { type: String, required: true },
  availableDays: [String], // e.g., ["Monday", "Wednesday", "Friday"]
  availableHours: {
    start: String, // e.g., "09:00"
    end: String    // e.g., "17:00"
  },
  resetPasswordOTP: {
    code: String,
    expiryTime: Date
  },
  Fees: { type: Number, required: true },
  profilePicture: { type: String },
  profilePictureId: { type: String }, // Cloudinary public_id
  createdAt: { type: Date, default: Date.now }
});

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;