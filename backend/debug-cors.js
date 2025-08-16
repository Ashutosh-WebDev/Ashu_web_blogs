// Debug server to test CORS configuration
const express = require('express');
const cors = require('cors');

// Initialize express app
const app = express();

// Phase 1: Basic setup
console.log('=== PHASE 1: Basic setup ===');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('✅ Basic middleware added');

// Phase 2: Test with minimal CORS
console.log('\n=== PHASE 2: Testing with minimal CORS ===');
try {
  // Test 1: No CORS
  console.log('Test 1: No CORS - should work');
  app.get('/test1', (req, res) => {
    res.json({ message: 'Test 1: No CORS - Success!' });
  });
  console.log('✅ Test 1 route added');

  // Test 2: Basic CORS with string origin
  console.log('\nTest 2: Basic CORS with string origin');
  app.use('/test2', cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));
  app.get('/test2', (req, res) => {
    res.json({ message: 'Test 2: Basic CORS with string origin - Success!' });
  });
  console.log('✅ Test 2 route added');

  // Test 3: CORS with function origin
  console.log('\nTest 3: CORS with function origin');
  const corsOptions3 = {
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:3000'];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  };
  app.use('/test3', cors(corsOptions3));
  app.get('/test3', (req, res) => {
    res.json({ message: 'Test 3: CORS with function origin - Success!' });
  });
  console.log('✅ Test 3 route added');

  // Test 4: CORS with environment variable
  console.log('\nTest 4: CORS with environment variable');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  console.log(`Frontend URL from env: ${frontendUrl}`);
  
  const corsOptions4 = {
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
  };
  
  app.use('/test4', cors(corsOptions4));
  app.options('/test4', cors(corsOptions4));
  app.get('/test4', (req, res) => {
    res.json({ 
      message: 'Test 4: CORS with environment variable - Success!',
      frontendUrl
    });
  });
  console.log('✅ Test 4 route added');

} catch (error) {
  console.error('❌ Error setting up test routes:', error);
  process.exit(1);
}

// Start the server
const PORT = process.env.PORT || 5004;
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n=== CORS Debug Server Running ===');
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log('Test endpoints:');
  console.log(`  GET  /test1 - No CORS`);
  console.log(`  GET  /test2 - Basic CORS with string origin`);
  console.log(`  GET  /test3 - CORS with function origin`);
  console.log(`  GET  /test4 - CORS with environment variable`);
  console.log('===============================\n');
});
