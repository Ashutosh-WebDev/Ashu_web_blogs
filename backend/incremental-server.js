// Incremental server to identify path-to-regexp error source
const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('Starting incremental server...');

// Initialize express app
const app = express();

// Phase 1: Basic middleware
console.log('Phase 1: Adding basic middleware...');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('✓ Basic middleware added');

// Phase 2: Add CORS
console.log('\nPhase 2: Adding CORS...');
try {
  const cors = require('cors');
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  console.log('✓ CORS middleware added');
} catch (error) {
  console.error('Error adding CORS:', error);
  process.exit(1);
}

// Phase 3: Add morgan logging
console.log('\nPhase 3: Adding request logging...');
try {
  const morgan = require('morgan');
  app.use(morgan('dev'));
  console.log('✓ Request logging added');
} catch (error) {
  console.error('Error adding morgan:', error);
  process.exit(1);
}

// Phase 4: Add routes one by one
console.log('\nPhase 4: Adding routes...');
try {
  // Health route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  console.log('✓ Health route added');

  // Blog routes
  const blogRoutes = require('./routes/blogRoutes');
  app.use('/api/blogs', blogRoutes);
  console.log('✓ Blog routes added');
} catch (error) {
  console.error('Error adding routes:', error);
  process.exit(1);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// Start the server
const PORT = process.env.PORT || 5003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log('Test endpoints:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/blogs');
});
