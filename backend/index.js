const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

// Secure headers using Helmet
app.use(helmet());

const allowedOrigins = [
  'https://agri-fusion.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : [])
];

// CORS configuration for React frontend
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply global rate limiter
app.use('/api', apiLimiter);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to Database
connectDB();

// Initialize sockets
require('./sockets/chatSocket')(io);

// Pass io to request object if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- API ROUTES ---
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/farmers', require('./routes/farmer.routes'));
app.use('/api', require('./routes/admin.routes'));
app.use('/api', require('./routes/order.routes'));
app.use('/api/payment', require('./routes/payment.routes'));

// Start server
server.listen(PORT, () => {
  console.log(`API Server running at http://localhost:${PORT}`);
});
