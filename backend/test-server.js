// Test server to debug path-to-regexp issue
const express = require('express');
const path = require('path');
const fs = require('fs');

// Log startup process
console.log('Starting test server...');

// Initialize express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

// Try importing and using the blog routes
try {
  console.log('Attempting to import blog routes...');
  const blogRoutes = require('./routes/blogRoutes');
  app.use('/api/blogs', blogRoutes);
  console.log('Blog routes imported successfully');
} catch (error) {
  console.error('Error importing blog routes:', error);
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
const PORT = process.env.PORT || 5002; // Using a different port
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Test endpoints:');
  console.log('  GET  /api/test');
  console.log('  GET  /api/blogs');
});
