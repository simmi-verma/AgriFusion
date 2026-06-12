const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = (roles = []) => {
  return (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7, token.length).trim();
    } else {
      token = req.cookies ? req.cookies.token : null;
    }

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
      }
      
      try {
        const user = await User.findById(decoded.id);
        if (!user) {
          return res.status(401).json({ error: 'User profile associated with token not found.' });
        }
        
        // Immediate suspension rejection check
        if (user.isSuspended) {
          return res.status(403).json({ error: 'Access denied. Your account has been suspended by an administrator.' });
        }

        // Role authorization check against actual DB record
        if (roles.length && !roles.includes(user.role)) {
          return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }

        req.user = {
          id: user._id.toString(),
          name: user.name,
          role: user.role
        };
        next();
      } catch (dbErr) {
        return res.status(500).json({ error: dbErr.message });
      }
    });
  };
};

module.exports = verifyToken;
