const router = require('express').Router();
const Cart = require('../models/Cart');
const verifyToken = require('../middleware/verifyToken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-intent', verifyToken(['customer']), async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const totalAmount = cart.items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
    
    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // amount in paise (INR)
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      totalAmount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
