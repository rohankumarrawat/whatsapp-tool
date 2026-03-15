const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const User = require('../models/User');

// Store active clients in memory. Key: userId, Value: WhatsApp Client instance
const clients = new Map();

// Helper to initialize client for a user
const initializeClient = (userId, io) => {
  if (clients.has(userId)) {
    console.log(`[WhatsApp] Client already exists for user ${userId}`);
    return clients.get(userId);
  }

  console.log(`[WhatsApp] Initializing new client for user ${userId}`);
  
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: userId }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu']
    }
  });

  client.on('qr', (qr) => {
    console.log(`[WhatsApp] QR Code generated for user ${userId}`);
    // Emit QR to frontend via Socket.io/SSE or we can just send it via API response for simplicity
    // If using Socket: io.to(userId).emit('qr', qr);
    // For now we will just store it temporarily or handle via simple polling
    global.qrCodes = global.qrCodes || {};
    global.qrCodes[userId] = qr;
  });

  client.on('ready', async () => {
    console.log(`[WhatsApp] Client is ready for user ${userId}!`);
    // Clear QR
    if (global.qrCodes && global.qrCodes[userId]) delete global.qrCodes[userId];
    
    // Update user in DB
    await User.findByIdAndUpdate(userId, { whatsappLinked: true, whatsappNumber: client.info.wid.user });
    
    // Optional: emit ready event
    clients.set(userId, client);
  });

  client.on('authenticated', () => {
    console.log(`[WhatsApp] Authenticated for user ${userId}`);
  });

  client.on('auth_failure', async msg => {
    console.error(`[WhatsApp] Authentication failure for user ${userId}`, msg);
    await User.findByIdAndUpdate(userId, { whatsappLinked: false });
    clients.delete(userId);
  });

  client.on('disconnected', async (reason) => {
    console.log(`[WhatsApp] Client disconnected for user ${userId}:`, reason);
    await User.findByIdAndUpdate(userId, { whatsappLinked: false });
    client.destroy();
    clients.delete(userId);
  });

  client.initialize();
  clients.set(userId, client);
  return client;
};

// @desc    Get QR code for user
// @route   GET /api/whatsapp/qr/:userId
// @access  Private
const getQR = async (req, res) => {
  const { userId } = req.params;
  
  let client = clients.get(userId);
  
  if (!client) {
    client = initializeClient(userId);
  }

  if (global.qrCodes && global.qrCodes[userId]) {
    res.json({ qr: global.qrCodes[userId], linked: false });
  } else {
    // Check if client is already ready
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ qr: null, linked: user.whatsappLinked, details: user.whatsappNumber });
  }
};

// @desc    Logout WhatsApp for user
// @route   POST /api/whatsapp/logout
// @access  Private
const logoutWhatsApp = async (req, res) => {
  const { userId } = req.body;
  const client = clients.get(userId);
  if (client) {
    await client.logout();
    client.destroy();
    clients.delete(userId);
    await User.findByIdAndUpdate(userId, { whatsappLinked: false, whatsappNumber: null });
    res.json({ message: 'WhatsApp session logged out' });
  } else {
    res.status(400).json({ message: 'No active session found' });
  }
};

// @desc    Send Message
// @route   POST /api/whatsapp/send
// @access  Private
const sendMessage = async (req, res) => {
  const { userId, numbers, message } = req.body;
  
  const client = clients.get(userId);
  if (!client) {
    return res.status(400).json({ message: 'WhatsApp client not connected. Please scan QR first.' });
  }

  let successCount = 0;
  let failCount = 0;

  // Process numbers (could be async in background, but keeping sync for simple API)
  for (let num of numbers) {
    try {
      // whatsapp format id usually ends with @c.us
      const formattedNum = num.replace(/\D/g, '') + '@c.us'; 
      await client.sendMessage(formattedNum, message);
      successCount++;
    } catch (err) {
      console.error(`Failed to send to ${num}`, err);
      failCount++;
    }
  }

  res.json({ message: 'Campaign executed', successCount, failCount });
};

// Auto-initialize existing linked clients on server start
const resumeSessions = async () => {
  try {
    const linkedUsers = await User.find({ whatsappLinked: true });
    for (let user of linkedUsers) {
      console.log(`[WhatsApp Auto-Resume] Resuming session for ${user.email} (${user._id})`);
      initializeClient(user._id.toString());
    }
  } catch (err) {
    console.error('Error auto-resuming WhatsApp sessions', err);
  }
};

module.exports = {
  getQR,
  logoutWhatsApp,
  sendMessage,
  resumeSessions
};
