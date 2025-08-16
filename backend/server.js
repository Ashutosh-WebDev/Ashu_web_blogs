// Server with CORS, Health, Blog, and Auth Routes
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('Starting server with all routes...');

const app = express();

// CORS Configuration
const allowedOrigins = [
  'https://5v6fvmsk-3000.inc1.devtunnels.ms',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://atp-web-udnp.onrender.com',
  'https://ashutoshpanda.in',
  'https://www.ashutoshpanda.in'
];

// Add development origins for local testing
const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000'
];

// Combine all allowed origins
const allAllowedOrigins = [...new Set([...allowedOrigins, ...developmentOrigins])];

// Log environment and allowed origins
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Allowed origins:', allAllowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (allAllowedOrigins.includes(origin)) {
      console.log('CORS Allowed for origin:', origin);
      return callback(null, true);
    }
    
    // Check if the origin matches a pattern (e.g., subdomains)
    if (origin.endsWith('.ashutoshpanda.in')) {
      console.log('CORS Allowed for subdomain:', origin);
      return callback(null, true);
    }
    
    // Log and block the request if origin is not allowed
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    console.warn('CORS Policy Violation:', msg);
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'X-API-Version',
    'X-HTTP-Method-Override'
  ],
  exposedHeaders: [
    'set-cookie',
    'Authorization',
    'x-auth-token',
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset'
  ],
  maxAge: 600, // Cache preflight request for 10 minutes
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.send('Server is running with all routes');
});

// Health routes
console.log('Loading health routes...');
try {
  const healthRoutes = require('./routes/healthRoutes');
  app.use('/api/health', healthRoutes);
  console.log('✓ Health routes mounted at /api/health');
} catch (error) {
  console.error('❌ Error loading health routes:', error);
  process.exit(1);
}

// Blog routes
console.log('Loading blog routes...');
try {
  const blogRoutes = require('./routes/blogRoutes');
  app.use('/api/blogs', blogRoutes);
  console.log('✓ Blog routes mounted at /api/blogs');
} catch (error) {
  console.error('❌ Error loading blog routes:', error);
  process.exit(1);
}

// Auth routes
console.log('Loading auth routes...');
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✓ Auth routes mounted at /api/auth');
} catch (error) {
  console.error('❌ Error loading auth routes:', error);
  process.exit(1);
}
app.get('/test-db', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    res.json({ success: true, collections });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update your MongoDB connection code (usually near the top of the file)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));


// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});
