const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const verifyToken = require('../middleware/verifyToken');

// Get past orders for logged in customer
router.get('/orders', verifyToken(['customer', 'admin']), async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id })
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders containing a farmer's products
router.get('/orders/farmer', verifyToken(['farmer']), async (req, res) => {
  try {
    const farmerProducts = await Product.find({ createdBy: req.user.id }).select('_id');
    const productIds = farmerProducts.map(p => p._id);
    
    const orders = await Order.find({ 'items.product': { $in: productIds } })
      .populate('customerId', 'name email')
      .populate('items.product')
      .sort({ createdAt: -1 });
      
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
