const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const verifyToken = require('../middleware/verifyToken');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidators, loginValidators, handleValidationErrors } = require('../validators');

// Get current authenticated user
router.get('/me', verifyToken(), async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id).select('-password');
    if (!userDoc) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userDoc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register
router.post('/register', authLimiter, registerValidators, handleValidationErrors, async (req, res) => {
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
router.post('/login', authLimiter, loginValidators, handleValidationErrors, async (req, res) => {
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
router.post('/refresh', async (req, res) => {
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
router.post('/logout', async (req, res) => {
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

module.exports = router;
