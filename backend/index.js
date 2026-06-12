const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs');
const csv = require('csv-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { Server } = require('socket.io');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Cart = require('./models/Cart');
const Chat = require('./models/Chat');
const Message = require('./models/Message');
const Farmer = require('./models/Farmer');
const RefreshToken = require('./models/RefreshToken');
const Dispute = require('./models/Dispute');
const verifyToken = require('./middleware/verifyToken');

const app = express();
const server = http.createServer(app);

// Secure headers using Helmet
app.use(helmet());

// CORS configuration for React frontend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // higher limit in development
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 1000, // higher limit in development
  message: { error: 'Too many login attempts, please try again after 15 minutes.' }
});

// Apply global rate limiter
app.use('/api', apiLimiter);

// Input Validation Middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const registerValidators = [
  body('email').isEmail().withMessage('Provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').trim(),
  body('name').notEmpty().withMessage('Name is required').trim().escape(),
  body('role').isIn(['farmer', 'customer']).withMessage('Role must be farmer or customer'),
  body('city').optional().trim().escape(),
  body('state').optional().trim().escape(),
  body('country').optional().trim().escape(),
  body('pincode').optional().trim().escape()
];

const loginValidators = [
  body('email').isEmail().withMessage('Provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required').trim()
];

const productValidators = [
  body('title').notEmpty().withMessage('Product title is required').trim().escape(),
  body('description').notEmpty().withMessage('Product description is required').trim().escape(),
  body('imageUrl').isURL().withMessage('Provide a valid image URL'),
  body('currentMarketPrice').isNumeric().withMessage('Market price must be a number'),
  body('sellingPrice').isNumeric().withMessage('Selling price must be a number')
];

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Socket.io Real-time Chat Connection
io.on('connection', (socket) => {
  console.log('🔌 User connected to socket:', socket.id);

  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`👤 Socket ${socket.id} joined chat room: ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected from socket:', socket.id);
  });
});

// Pass io to request object if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- API ROUTES ---

// 1. AUTH ROUTES
// Get current authenticated user
app.get('/api/auth/me', verifyToken(), async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id).select('-password');
    if (!userDoc) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userDoc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register
app.post('/api/auth/register', authLimiter, registerValidators, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, role, city, state, country, pincode } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      location: role === 'farmer' ? { city, state, country, pincode } : undefined
    });
    await newUser.save();
    res.status(201).json({ message: 'registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', authLimiter, loginValidators, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Sign 15-minute access token
    const accessToken = jwt.sign(
      { id: user._id, name: user.name, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // Generate secure 7-day refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await new RefreshToken({
      token: refreshToken,
      userId: user._id,
      expiresAt
    }).save();
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt
    });
    
    res.json({
      token: accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        email: user.email,
        location: user.location
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rotate JWT Tokens
app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided.' });
  }

  try {
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
    if (!tokenDoc) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    if (new Date() > tokenDoc.expiresAt) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      return res.status(401).json({ error: 'Refresh token has expired.' });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, name: user.name, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    await RefreshToken.deleteOne({ _id: tokenDoc._id }); // delete old
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await new RefreshToken({
      token: newRefreshToken,
      userId: user._id,
      expiresAt
    }).save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt
    });

    res.json({ token: newAccessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    res.clearCookie('refreshToken');
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. PRODUCT ROUTES
// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().populate('createdBy', 'name email role location');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a product (Farmer only)
app.post('/api/products', verifyToken(['farmer']), productValidators, handleValidationErrors, async (req, res) => {
  try {
    const { title, description, imageUrl, currentMarketPrice, sellingPrice, tags } = req.body;
    const newProduct = new Product({
      title,
      description,
      imageUrl,
      currentMarketPrice: Number(currentMarketPrice),
      sellingPrice: Number(sellingPrice),
      tags: Array.isArray(tags) ? tags : [],
      createdBy: req.user.id
    });
    await newProduct.save();
    
    const populated = await Product.findById(newProduct._id).populate('createdBy', 'name email role location');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit a product (Farmer and Admin)
app.put('/api/products/:id', verifyToken(['farmer', 'admin']), productValidators, handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to edit this product' });
    }
    
    Object.assign(product, req.body);
    await product.save();
    
    const populated = await Product.findById(product._id).populate('createdBy', 'name email role location');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a product (Farmer and Admin)
app.delete('/api/products/:id', verifyToken(['farmer', 'admin']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this product' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CART ROUTES
// Get cart items
app.get('/api/cart', verifyToken(['customer']), async (req, res) => {
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
app.post('/api/cart/add/:productId', verifyToken(['customer']), async (req, res) => {
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
app.post('/api/cart/remove/:productId', verifyToken(['customer']), async (req, res) => {
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
app.post('/api/cart/buy', verifyToken(['customer']), async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    const cart = await Cart.findOne({ customerId: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    const totalAmount = cart.items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

    // Verify payment if Stripe secret key is configured
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

    // Group items by the farmer who created the product (createdBy)
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

// Get past orders for logged in customer
app.get('/api/orders', verifyToken(['customer']), async (req, res) => {
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
app.get('/api/orders/farmer', verifyToken(['farmer']), async (req, res) => {
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

// 4. CHAT ROUTES
// Get list of conversations
app.get('/api/chat/conversations', verifyToken(['customer', 'farmer']), async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id }).populate('participants', 'name email role');
    const conversations = chats.map(chat => {
      const other = chat.participants.find(p => p._id.toString() !== req.user.id);
      return { chatId: chat._id, otherUser: other };
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get/create chat with specific user
app.get('/api/chat/:receiverId', verifyToken(['customer', 'farmer']), async (req, res) => {
  try {
    const { receiverId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(receiverId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user or receiver ID.' });
    }

    let chat = await Chat.findOne({ participants: { $all: [userId, receiverId] } });
    if (!chat) {
      chat = new Chat({ participants: [userId, receiverId] });
      await chat.save();
    }

    const messages = await Message.find({ chatId: chat._id }).populate('sender', 'name role');
    const receiverUser = await User.findById(receiverId).select('name role location');
    
    res.json({
      messages,
      chatId: chat._id,
      userId,
      receiverId,
      receiverName: receiverUser ? receiverUser.name : 'User'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message
app.post('/api/chat/send', verifyToken(['customer', 'farmer']), async (req, res) => {
  try {
    const { chatId, content } = req.body;
    if (!content || !chatId) {
      return res.status(400).json({ error: 'Chat ID and content are required' });
    }

    const newMessage = new Message({
      chatId,
      sender: req.user.id,
      content
    });
    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name role');
    
    // Broadcast the message to the Socket.io room
    io.to(chatId).emit('message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. FARMERS / MAP ROUTES
// Get all farmers from database
app.get('/api/farmers', async (req, res) => {
  try {
    const farmers = await User.find({ role: 'farmer' }).select('name location');
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch farmers' });
  }
});

// Get nearby farmers parsed from CSV
app.get('/api/farmers/nearby', (req, res) => {
  const farmers = [];
  const csvPath = path.join(__dirname, 'india_crop_locations.csv');
  
  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({ error: 'Farmers CSV file not found' });
  }

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      // Normal row: id,state,latitude,longitude,crops
      if (row.id && row.id.startsWith('crop_')) {
        farmers.push({
          id: row.id,
          state: row.state,
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          crops: row.crops
        });
      } 
      // Re-headered row: state,latitude,longitude,crops,farmerId
      else if (row.id && row.id !== 'state' && row.state && row.latitude) {
        farmers.push({
          id: row.crops, // crops column holds farmerId
          state: row.id,       // id column holds state
          latitude: parseFloat(row.state), // state column holds latitude
          longitude: parseFloat(row.latitude), // latitude column holds longitude
          crops: row.longitude // longitude column holds crops
        });
      }
    })
    .on('end', () => {
      res.json(farmers);
    })
    .on('error', (err) => {
      res.status(500).json({ error: err.message });
    });
});

// 6. DISPUTE & ADMIN SUPERUSER APIS
// Customer or Farmer lodges a dispute
app.post('/api/disputes/create', verifyToken(['customer', 'farmer']), async (req, res) => {
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
app.get('/api/admin/analytics', verifyToken(['admin']), async (req, res) => {
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
app.get('/api/admin/users', verifyToken(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin toggles user suspension status
app.post('/api/admin/users/:id/suspend', verifyToken(['admin']), async (req, res) => {
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
app.post('/api/admin/users/:id/verify-farmer', verifyToken(['admin']), async (req, res) => {
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
app.get('/api/admin/disputes', verifyToken(['admin']), async (req, res) => {
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
app.post('/api/admin/disputes/:id/resolve', verifyToken(['admin']), async (req, res) => {
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
app.post('/api/admin/disputes/:id/message', verifyToken(['admin']), async (req, res) => {
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

// 7. STRIPE PAYMENT INTENT API
app.post('/api/payment/create-payment-intent', verifyToken(['customer']), async (req, res) => {
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

// Start server
server.listen(PORT, () => {
  console.log(`🚀 API Server running at http://localhost:${PORT}`);
});
