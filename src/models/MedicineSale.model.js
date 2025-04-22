const mongoose = require('mongoose');

const medicineSaleSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  medicines: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    quantity: { type: Number, required: true },
    priceAtSale: { type: Number, required: true },
    costPriceAtSale: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  profit: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card'], required: true },
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist', required: true },
  createdAt: { type: Date, default: Date.now }
});

const MedicineSale = mongoose.model('MedicineSale', medicineSaleSchema);
module.exports = MedicineSale;