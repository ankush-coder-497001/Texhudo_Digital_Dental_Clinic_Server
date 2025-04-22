const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/Medicine.ctrl');
const medicineSaleController = require('../controllers/MedicineSale.ctrl');
const authMiddleware = require('../middlewares/authMiddleware');

// Medicine management routes
router.post('/', authMiddleware(['pharmacist']), medicineController.addMedicine);
router.put('/:id', authMiddleware(['pharmacist']), medicineController.updateMedicine);
router.get('/', authMiddleware(['pharmacist']), medicineController.getMedicines);
router.get('/:id', authMiddleware(['pharmacist']), medicineController.getMedicineById);
router.put('/:id/stock', authMiddleware(['pharmacist']), medicineController.updateStock);
router.delete('/:id', authMiddleware(['pharmacist']), medicineController.deleteMedicine);
router.get('/low-stock', authMiddleware(['pharmacist']), medicineController.getLowStockMedicines);

// Sales and analytics routes
router.post('/sales', authMiddleware(['pharmacist']), medicineSaleController.createSale);
router.get('/sales', authMiddleware(['pharmacist']), medicineSaleController.getSales);
router.get('/sales/stats', authMiddleware(['pharmacist']), medicineSaleController.getSaleStats);
router.get('/sales/top-selling', authMiddleware(['pharmacist']), medicineSaleController.getTopSellingMedicines);
router.get('/sales/:id', authMiddleware(['pharmacist']), medicineSaleController.getSaleById);

module.exports = router;