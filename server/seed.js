const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB Connected');
    
    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@marketing.local' });
    if (!adminExists) {
      await User.create({
        name: 'Master Admin',
        email: 'admin@marketing.local',
        password: 'adminpassword',
        role: 'admin'
      });
      console.log('Admin user seeded (admin@marketing.local / adminpassword)');
    } else {
      console.log('Admin already exists');
    }
    
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
