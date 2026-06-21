const router = require('express').Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Dispute = require('../models/Dispute');
const RefreshToken = require('../models/RefreshToken');
const verifyToken = require('../middleware/verifyToken');

// Customer or Farmer lodges a dispute
router.post('/disputes/create', verifyToken(['customer', 'farmer']), async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    if (!orderId || !reason) {
      return res.status(400).json({ error: 'Order ID and reason are required' });
    }

    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Identify the farmer (creator of the first product in the order)
    const firstItem = order.items.find(i => i.product);
    if (!firstItem) {
      return res.status(400).json({ error: 'Order items are invalid' });
    }
    const farmerId = firstItem.product.createdBy;

    const dispute = new Dispute({
      orderId,
      customerId: order.customerId,
      farmerId,
      reason,
      complaints: [{ sender: req.user.id, message: reason }]
    });

    await dispute.save();
    res.status(201).json(dispute);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin fetches platform dashboard metrics and analytics
router.get('/admin/analytics', verifyToken(['admin']), async (req, res) => {
  try {
    // 1. Total Revenue
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // 2. Active User Counts (DAU/MAU estimates based on user count)
    const userCountAgg = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    const userCounts = {};
    userCountAgg.forEach(item => {
      userCounts[item._id] = item.count;
    });

    // 3. Crop Listings over time
    const cropListingsOverTime = await Product.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. State sales distribution for map heatmap
    const orders = await Order.find()
      .populate('customerId', 'name location')
      .populate('items.product');

    res.json({
      totalRevenue,
      userCounts,
      cropListingsOverTime,
      orders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin fetches list of all users
router.get('/admin/users', verifyToken(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin toggles user suspension status
router.post('/admin/users/:id/suspend', verifyToken(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot suspend administrators' });

    user.isSuspended = !user.isSuspended;
    await user.save();

    // If suspended, clear all active refresh tokens so they are logged out immediately
    if (user.isSuspended) {
      await RefreshToken.deleteMany({ userId: user._id });
    }

    res.json({ message: 'User suspension toggled', user: { id: user._id, name: user.name, isSuspended: user.isSuspended } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin toggles farmer credential verification status
router.post('/admin/users/:id/verify-farmer', verifyToken(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'farmer') return res.status(400).json({ error: 'User role is not farmer' });

    user.isVerifiedFarmer = !user.isVerifiedFarmer;
    await user.save();
    res.json({ message: 'Farmer verification status updated', user: { id: user._id, name: user.name, isVerifiedFarmer: user.isVerifiedFarmer } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin fetches dispute log complaint threads
router.get('/admin/disputes', verifyToken(['admin']), async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate('orderId')
      .populate('customerId', 'name email')
      .populate('farmerId', 'name email')
      .populate('complaints.sender', 'name role')
      .sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin marks dispute thread resolved
router.post('/admin/disputes/:id/resolve', verifyToken(['admin']), async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    dispute.status = 'resolved';
    await dispute.save();
    res.json({ message: 'Dispute resolved successfully', dispute });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin posts message to dispute complaint thread
router.post('/admin/disputes/:id/message', verifyToken(['admin']), async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

    dispute.complaints.push({
      sender: req.user.id, // Admin
      message: req.body.message
    });
    
    await dispute.save();
    const populated = await Dispute.findById(dispute._id)
      .populate('orderId')
      .populate('customerId', 'name email')
      .populate('farmerId', 'name email')
      .populate('complaints.sender', 'name role');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
