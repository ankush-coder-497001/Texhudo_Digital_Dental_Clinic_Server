const mongoose = require('mongoose');

const pharmacistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  // licenseNumber: { type: String, required: true },
  profilePicture: { type: String },
  profilePictureId: { type: String }, // Cloudinary public_id
  resetPasswordOTP: {
    code: String,
    expiryTime: Date
  },
  role: {type:String},
  createdAt: { type: Date, default: Date.now }
});

const Pharmacist = mongoose.model('Pharmacist', pharmacistSchema);
module.exports = Pharmacist;