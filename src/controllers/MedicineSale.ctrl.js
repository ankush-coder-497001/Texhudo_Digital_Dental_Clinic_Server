const MedicineSale = require('../models/MedicineSale.model');
const Medicine = require('../models/Medicine.model');
const mongoose = require('mongoose');

exports.createSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { customerName, customerPhone, medicines, paymentMethod } = req.body;
        
        // Validate payment method
        if (!['cash', 'card'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method. Must be either cash or card'
            });
        }

        let totalAmount = 0;
        let totalProfit = 0;
        
        // Validate and calculate totals
        const medicineDetails = [];
        for (const item of medicines) {
            const medicine = await Medicine.findById(item.medicineId).session(session);
            if (!medicine) {
                await session.abortTransaction();
                return res.status(404).json({
                    success: false,
                    message: `Medicine with ID ${item.medicineId} not found`
                });
            }

            if (medicine.quantity < item.quantity) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${medicine.name}. Available: ${medicine.quantity}`
                });
            }

            const itemTotal = medicine.price * item.quantity;
            const itemProfit = (medicine.price - medicine.costPrice) * item.quantity;
            totalAmount += itemTotal;
            totalProfit += itemProfit;

            medicineDetails.push({
                medicine: medicine._id,
                quantity: item.quantity,
                priceAtSale: medicine.price,
                costPriceAtSale: medicine.costPrice
            });

            // Update stock
            medicine.quantity -= item.quantity;
            await medicine.save({ session });
        }

        const sale = new MedicineSale({
            customerName,
            customerPhone,
            medicines: medicineDetails,
            totalAmount,
            profit: totalProfit,
            paymentMethod,
            soldBy: req.user.id
        });

        await sale.save({ session });
        await session.commitTransaction();
        
        res.json({
            success: true,
            message: 'Sale completed successfully',
            sale
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

exports.getSales = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {};
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const sales = await MedicineSale.find(query)
            .populate('medicines.medicine', 'name genericName manufacturer')
            .populate('soldBy', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            sales
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

exports.getSaleById = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await MedicineSale.findById(id)
            .populate('medicines.medicine')
            .populate('soldBy', 'name');

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        res.json({
            success: true,
            sale
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

exports.getSaleStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {};
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const sales = await MedicineSale.find(query);
        
        const stats = {
            totalSales: sales.length,
            totalRevenue: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
            totalProfit: sales.reduce((sum, sale) => sum + sale.profit, 0),
            averageTransactionValue: 0,
            paymentMethodBreakdown: {
                cash: sales.filter(sale => sale.paymentMethod === 'cash').length,
                card: sales.filter(sale => sale.paymentMethod === 'card').length
            }
        };
        
        stats.averageTransactionValue = stats.totalSales > 0 ? 
            stats.totalRevenue / stats.totalSales : 0;

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

exports.getTopSellingMedicines = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {};
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const topMedicines = await MedicineSale.aggregate([
            { $match: query },
            { $unwind: "$medicines" },
            {
                $group: {
                    _id: "$medicines.medicine",
                    totalQuantity: { $sum: "$medicines.quantity" },
                    totalRevenue: { 
                        $sum: { 
                            $multiply: ["$medicines.quantity", "$medicines.priceAtSale"] 
                        } 
                    },
                    totalProfit: {
                        $sum: {
                            $multiply: [
                                "$medicines.quantity",
                                { $subtract: ["$medicines.priceAtSale", "$medicines.costPriceAtSale"] }
                            ]
                        }
                    }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);

        // Populate medicine details
        const populatedTopMedicines = await Medicine.populate(topMedicines, {
            path: "_id",
            select: "name genericName manufacturer"
        });

        res.json({
            success: true,
            topMedicines: populatedTopMedicines
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};