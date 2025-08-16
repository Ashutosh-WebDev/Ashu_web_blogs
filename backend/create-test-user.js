require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if test user already exists
    let user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      // Create test user
      const hashedPassword = await bcrypt.hash('test1234', 10);
      
      user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword
      });
      
      await user.save();
      console.log('Test user created successfully');
    } else {
      console.log('Test user already exists');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('\nTest User Credentials:');
    console.log('---------------------');
    console.log(`Email: ${user.email}`);
    console.log('Password: test1234');
    console.log('\nJWT Token:');
    console.log('----------');
    console.log(token);
    console.log('\nUse this token in your test requests with the Authorization header:');
    console.log('Authorization: Bearer ' + token);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
