const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const { resumeSessions } = require('./controllers/whatsappController');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB().then(async () => {
  // Auto-seed Admin
  const adminExists = await User.findOne({ email: 'admin@marketing.local' });
  if (!adminExists) {
    await User.create({
      name: 'Master Admin',
      email: 'admin@marketing.local',
      password: 'adminpassword',
      role: 'admin'
    });
    console.log('Admin user seeded (admin@marketing.local / adminpassword)');
  }

  // Auto-resume WhatsApp sessions after DB connects
  resumeSessions();
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

const path = require('path');

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
