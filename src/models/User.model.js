const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  paymentMethods: [{
    cardLast4: String,
    cardBrand: String,
    paymentMethodId: String // From payment processor like Stripe
  }],
  resetPasswordOTP: {
    code: String,
    expiryTime: Date
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
module.exports = User;