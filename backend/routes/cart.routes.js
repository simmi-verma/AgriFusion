const router = require('express').Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const verifyToken = require('../middleware/verifyToken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get cart items
router.get('/', verifyToken(['customer']), async (req, res) => {
  try {
    let cart = await Cart.findOne({ customerId: req.user.id }).populate('items.product');
    if (!cart) {
      cart = new Cart({ customerId: req.user.id, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add to cart
router.post('/add/:productId', verifyToken(['customer']), async (req, res) => {
  try {
    const { productId } = req.params;
    const customerId = req.user.id;
    let cart = await Cart.findOne({ customerId });
    if (!cart) {
      cart = new Cart({ customerId, items: [] });
    }

    const existing = cart.items.find(item => item.product.toString() === productId);
    if (existing) {
      existing.quantity++;
    } else {
      cart.items.push({ product: productId, quantity: 1 });
    }

    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove from cart
router.post('/remove/:productId', verifyToken(['customer']), async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user.id });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
    await cart.save();
    
    const populated = await Cart.findById(cart._id).populate('items.product');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Checkout / Buy
router.post('/buy', verifyToken(['customer']), async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    const cart = await Cart.findOne({ customerId: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    const totalAmount = cart.items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

    // Stripe verification only runs in test mode (sk_test_ keys) so the demo
    // works without a configured Stripe account. ⚠️ In production this should
    // run whenever a paymentIntentId is present, not gated on key prefix.
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test')) {
      if (!paymentIntentId) {
        return res.status(400).json({ error: 'Payment is required to complete purchase.' });
      }
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ error: `Payment not verified. Status: ${paymentIntent.status}` });
        }
        if (paymentIntent.amount !== totalAmount * 100) {
          return res.status(400).json({ error: 'Payment amount mismatch' });
        }
      } catch (stripeErr) {
        return res.status(400).json({ error: `Stripe verification failed: ${stripeErr.message}` });
      }
    }

    // Filter out items with missing products
    const validItems = cart.items.filter(item => item.product);
    if (validItems.length === 0) {
      return res.status(400).json({ error: 'Cart has no valid products.' });
    }

    // Split a multi-farmer cart into one Order per farmer so each farmer only
    // sees orders containing their own products, with their own totalAmount.
    const itemsByFarmer = {};
    for (const item of validItems) {
      const farmerId = item.product.createdBy ? item.product.createdBy.toString() : 'unknown_farmer';
      if (!itemsByFarmer[farmerId]) {
        itemsByFarmer[farmerId] = [];
      }
      itemsByFarmer[farmerId].push(item);
    }

    const createdOrders = [];
    for (const farmerId of Object.keys(itemsByFarmer)) {
      const farmerItems = itemsByFarmer[farmerId];
      const farmerTotal = farmerItems.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

      const order = new Order({
        customerId: req.user.id,
        items: farmerItems.map(i => ({ product: i.product._id, quantity: i.quantity })),
        totalAmount: farmerTotal,
        paymentStatus: paymentIntentId ? 'paid' : 'pending',
        stripePaymentIntentId: paymentIntentId || undefined
      });
      await order.save();
      createdOrders.push(order);
    }

    await Cart.deleteOne({ customerId: req.user.id });
    res.json({ message: 'Order placed successfully', orders: createdOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
