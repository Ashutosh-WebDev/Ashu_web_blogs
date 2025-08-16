const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';

// Test image path - using a sample image
const testImagePath = path.join(__dirname, 'test-image.jpg');

// Check if test image exists, if not create a dummy one
if (!fs.existsSync(testImagePath)) {
  console.log('Creating test image...');
  // Create a small red square as a test image
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  
  // Fill with red
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 200, 200);
  
  // Add some text
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Arial';
  ctx.fillText('Test Image', 40, 100);
  
  // Save the image
  const out = fs.createWriteStream(testImagePath);
  const stream = canvas.createJPEGStream();
  stream.pipe(out);
  
  out.on('finish', () => {
    console.log(`Test image created at: ${testImagePath}`);
    performUpload();
  });
} else {
  performUpload();
}

async function getTestUserToken() {
  try {
    // Connect to database
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Find or create test user
    let user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('test1234', 10);
      
      user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword
      });
      
      await user.save();
      console.log('Test user created successfully');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('Generated JWT token for test user');
    return token;
  } catch (error) {
    console.error('Error getting test user token:', error);
    throw error;
  }
}

async function performUpload() {
  try {
    // Get a valid JWT token for testing
    console.log('Getting JWT token for test user...');
    const token = await getTestUserToken();
    console.log('Using JWT token for authentication');
    
    // Verify the server is running
    console.log('Verifying server connection...');
    try {
      const pingResponse = await axios.get('http://localhost:5000/api/health');
      console.log('Server status:', pingResponse.data);
    } catch (pingError) {
      console.warn('Could not verify server health endpoint, continuing anyway...');
    }
    console.log('Starting image upload test...');
    
    // Create form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    
    // Get file stats for logging
    const stats = fs.statSync(testImagePath);
    console.log(`Uploading test image (${(stats.size / 1024).toFixed(2)} KB)...`);
    
    // Log the request details
    console.log('Sending upload request...');
    console.log('URL: http://localhost:5000/api/upload');
    console.log('Headers:', {
      ...formData.getHeaders(),
      'Content-Length': stats.size,
      'Authorization': `Bearer ${token.substring(0, 10)}...`
    });
    
    // Send request to upload endpoint
    const response = await axios.post('http://localhost:5000/api/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Length': stats.size,
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    console.log('Upload successful!');
    console.log('Response:', response.data);
    
    // Test if the file is accessible
    if (response.data.file && response.data.file.url) {
      console.log('\nTesting file access...');
      const fileUrl = `http://localhost:5000${response.data.file.url}`;
      console.log(`File should be accessible at: ${fileUrl}`);
      
      // Try to access the file
      try {
        const fileResponse = await axios.head(fileUrl);
        console.log(`File access test: SUCCESS (Status: ${fileResponse.status})`);
      } catch (error) {
        console.error('File access test: FAILED');
        console.error('Error accessing file:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
      }
    }
    
  } catch (error) {
    console.error('Upload failed!');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}
