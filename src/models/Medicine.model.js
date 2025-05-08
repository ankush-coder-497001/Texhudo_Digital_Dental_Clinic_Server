const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  distributor: String,
  price: { type: Number, required: true },
  costPerUnit: { type: Number, required: true },
  quantity: { type: Number, required: true },
  grams: { type: String, required: true },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pharmacist",
    required: true,
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacist" },
  createdAt: { type: Date, default: Date.now },
  lowStockThreshold: { type: Number, required: true, default: 10 },
  isLowStock: { type: Boolean, default: false },
  notifications: [
    {
      message: String,
      date: { type: Date, default: Date.now },
      isRead: { type: Boolean, default: false },
    },
  ],
});

const categorySchema = new mongoose.Schema({
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const distributorSchema = new mongoose.Schema({
  distributorName: { type: String, required: true },
  distributorPhoneNum: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Category = mongoose.model("New Category", categorySchema);
const Distributor = mongoose.model("Distributor", distributorSchema);
const Medicine = mongoose.model("Medicine", medicineSchema);
module.exports = { Category, Distributor, Medicine };
