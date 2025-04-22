const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: { type: String, required: true },
  manufacturer: { type: String, required: true },
  category: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  batchNumber: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist' },
  createdAt: { type: Date, default: Date.now },
  lowStockThreshold: { type: Number, required: true, default: 10 },
  isLowStock: { type: Boolean, default: false },
  notifications: [{
    message: String,
    date: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
  }]
});

const Medicine = mongoose.model('Medicine', medicineSchema);
module.exports = Medicine;