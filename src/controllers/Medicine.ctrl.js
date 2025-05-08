const { Medicine, Category, Distributor } = require("../models/Medicine.model");
// const createPaymentIntent  = require('../services/paymentService');
const { sendEmail } = require("../services/emailService");
const Medicine = require('../models/Medicine.model');

const checkAndUpdateStockStatus = async (medicine) => {
  const isLowStock = medicine.quantity <= medicine.lowStockThreshold;
  if (isLowStock !== medicine.isLowStock) {
    medicine.isLowStock = isLowStock;
    if (isLowStock) {
      medicine.notifications.push({
        message: `Low stock alert: ${medicine.name} has only ${medicine.quantity} units remaining`,
      });
    }
    await medicine.save();
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { category } = req.body;
    const newCategory = new Category({
      category,
    });
    await newCategory.save();

    return res.status(201).json({
      status: true,
      message: "New Category Added Successfully",
      newCategory,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error Adding new Category",
      error: error.message,
    });
  }
};

exports.addDistributor = async (req, res) => {
  try {
    const { distributorName, distributorPhoneNum } = req.body;
    const newDistributor = new Distributor({
      distributorName,
      distributorPhoneNum,
    });
    await newDistributor.save();

    return res.status(201).json({
      status: true,
      message: "New Distributor Added",
      newDistributor,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error adding new Category",
      error: error.message,
    });
  }
};

exports.getCombinedInventory = async (req, res) => {
    try {
        const [categories, distributors] = await Promise.all([
            Category.find(),
            Distributor.find().sort({category: -1})
        ])
       res.json({
            status:true,
            data: {
                categories,
                distributors
            }
        })
    } catch (error) {
        return res.status(401).send({
            status:false,
            message:'Unable to find Data',
            error:error.message
        })
    }
}
exports.addMedicine = async (req, res) => {
  try {
    const {
      name,
      distributor,
      price,
      costPerUnit,
      quantity,
      grams,
      lowStockThreshold,
    } = req.body;

    const medicine = new Medicine({
      name,
      distributor,
      price,
      costPerUnit,
      quantity,
      grams,
      lowStockThreshold: lowStockThreshold || 10,
      addedBy: req.user.id,
    });

    await medicine.save();
    await checkAndUpdateStockStatus(medicine);

    res.status(201).json({
      success: true,
      message: "Medicine added successfully",
      medicine,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    updateData.updatedBy = req.user.id;

    const medicine = await Medicine.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.json({
      success: true,
      message: "Medicine updated successfully",
      medicine,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find()
      .sort({ name:-1 })
      .populate("addedBy", "name")
      .populate("updatedBy", "name");

    res.json({
      success: true,
      medicines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findById(id)
      .populate("addedBy", "name")
      .populate("updatedBy", "name");

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.json({
      success: true,
      medicine,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body;

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    if (operation === "add") {
      medicine.quantity += quantity;
    } else if (operation === "subtract") {
      if (medicine.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock",
        });
      }
      medicine.quantity -= quantity;
    }

    medicine.updatedBy = req.user.id;
    await medicine.save();

    await checkAndUpdateStockStatus(medicine);

    res.json({
      success: true,
      message: "Stock updated successfully",
      medicine,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findByIdAndDelete(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ isLowStock: true })
      .populate("addedBy", "name email")
      .populate("updatedBy", "name email");

    res.json({
      success: true,
      medicines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const medicines = await Medicine.find({
      "notifications.isRead": false,
    }).select("name notifications");

    const notifications = medicines.reduce((acc, medicine) => {
      const unreadNotifications = medicine.notifications.filter(
        (n) => !n.isRead
      );
      return [
        ...acc,
        ...unreadNotifications.map((n) => ({
          ...n.toObject(),
          medicineName: medicine.name,
          medicineId: medicine._id,
        })),
      ];
    }, []);

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { medicineId, notificationId } = req.params;

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    const notification = medicine.notifications.id(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    await medicine.save();

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
