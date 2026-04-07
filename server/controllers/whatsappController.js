const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const WhatsAppAccount = require('../models/WhatsAppAccount');

// Store active clients in memory. Key: accountId, Value: WhatsApp Client instance
const clients = new Map();

// Helper to initialize client for an account
const initializeClient = (accountId) => {
  if (clients.has(accountId)) {
    console.log(`[WhatsApp] Client already exists for account ${accountId}`);
    return clients.get(accountId);
  }

  console.log(`[WhatsApp] Initializing new client for account ${accountId}`);
  
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: `acc_${accountId}` }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu']
    }
  });

  client.on('qr', (qr) => {
    console.log(`[WhatsApp] QR Code generated for account ${accountId}`);
    global.qrCodes = global.qrCodes || {};
    global.qrCodes[accountId] = qr;
  });

  client.on('ready', async () => {
    console.log(`[WhatsApp] Client is ready for account ${accountId}!`);
    if (global.qrCodes && global.qrCodes[accountId]) delete global.qrCodes[accountId];
    
    await WhatsAppAccount.findByIdAndUpdate(accountId, { isLinked: true, number: client.info.wid.user });
    clients.set(accountId, client);
  });

  client.on('authenticated', () => {
    console.log(`[WhatsApp] Authenticated for account ${accountId}`);
  });

  client.on('auth_failure', async msg => {
    console.error(`[WhatsApp] Authentication failure for account ${accountId}`, msg);
    await WhatsAppAccount.findByIdAndUpdate(accountId, { isLinked: false });
    clients.delete(accountId);
  });

  client.on('disconnected', async (reason) => {
    console.log(`[WhatsApp] Client disconnected for account ${accountId}:`, reason);
    await WhatsAppAccount.findByIdAndUpdate(accountId, { isLinked: false });
    client.destroy();
    clients.delete(accountId);
  });

  client.on('message_ack', async (msg, ack) => {
    const Campaign = require('../models/Campaign');
    let status = 'sent';
    if (ack === 2) status = 'delivered';
    if (ack === 3) status = 'read';
    if (msg.id && msg.id._serialized) {
      await Campaign.updateRecipientStatusByMessageId(msg.id._serialized, status);
    }
  });

  client.on('message', async msg => {
    if (msg.from === 'status@broadcast') return;
    
    try {
      const AutoReply = require('../models/AutoReply');
      const account = await WhatsAppAccount.findById(accountId);
      if (!account) return;

      const userRules = await AutoReply.findByUserId(account.userId);
      const activeRules = userRules.filter(r => r.isActive && (r.accountId === null || r.accountId === accountId));
      
      const incomingText = msg.body.toLowerCase();
      
      for (const rule of activeRules) {
        let isMatch = false;
        if (rule.matchType === 'exact' && incomingText === rule.keyword) isMatch = true;
        if (rule.matchType === 'contains' && incomingText.includes(rule.keyword)) isMatch = true;
        if (rule.matchType === 'startsWith' && incomingText.startsWith(rule.keyword)) isMatch = true;
        
        if (isMatch) {
          await msg.reply(rule.replyText);
          break; // trigger only first matching rule
        }
      }
    } catch (err) {
      console.error('Error in auto-reply listener', err);
    }
  });

  client.initialize().catch(err => console.log('WhatsApp Client Init Error:', err));
  clients.set(accountId, client);
  return client;
};

// @desc    Get all WhatsApp accounts for user
// @route   GET /api/whatsapp/accounts/:userId
const getAccounts = async (req, res) => {
  const { userId } = req.params;
  const accounts = await WhatsAppAccount.findByUserId(userId);
  res.json(accounts);
};

// @desc    Create a new WhatsApp account
// @route   POST /api/whatsapp/accounts
const createAccount = async (req, res) => {
  const { userId, name } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  
  const account = await WhatsAppAccount.create({ userId, name: name || 'New Account' });
  initializeClient(account._id);
  res.status(201).json(account);
};

// @desc    Get QR code for account
// @route   GET /api/whatsapp/qr/:accountId
const getQR = async (req, res) => {
  const { accountId } = req.params;
  
  let client = clients.get(accountId);
  if (!client) {
    client = initializeClient(accountId);
  }

  if (global.qrCodes && global.qrCodes[accountId]) {
    res.json({ qr: global.qrCodes[accountId], linked: false });
  } else {
    const account = await WhatsAppAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    res.json({ qr: null, linked: account.isLinked, details: account.number });
  }
};

// @desc    Logout and optional remove account
// @route   POST /api/whatsapp/logout
const logoutWhatsApp = async (req, res) => {
  const { accountId, removeRecord } = req.body;
  
  const client = clients.get(accountId);
  if (client) {
    try {
      await client.logout();
    } catch(e) {}
    client.destroy();
    clients.delete(accountId);
  }

  if (removeRecord) {
    await WhatsAppAccount.findByIdAndDelete(accountId);
    res.json({ message: 'WhatsApp session logged out and account removed' });
  } else {
    await WhatsAppAccount.findByIdAndUpdate(accountId, { isLinked: false, number: null });
    res.json({ message: 'WhatsApp session logged out' });
  }
};

// @desc    Send Message
// @route   POST /api/whatsapp/send
const sendMessage = async (req, res) => {
  let { accountId, groupId, message } = req.body;
  let numbers = req.body.numbers;
  
  // Handle numbers from FormData (stringified)
  if (typeof numbers === 'string') {
    try {
      numbers = JSON.parse(numbers);
    } catch(e) {
      numbers = numbers.split(',');
    }
  }
  if (!Array.isArray(numbers)) numbers = [];
  
  const client = clients.get(accountId);
  if (!client) {
    if (req.file) {
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: 'WhatsApp client not connected. Please connect account first.' });
  }

  let finalNumbers = [...numbers];

  if (groupId) {
    const Contact = require('../models/Contact');
    const groupContacts = await Contact.findByGroup(groupId);
    finalNumbers.push(...groupContacts.map(c => c.number));
  }

  if (finalNumbers.length === 0) {
    if (req.file) {
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: 'No valid numbers found' });
  }

  let media = null;
  const fs = require('fs');
  if (req.file) {
    try {
      const { MessageMedia } = require('whatsapp-web.js');
      // Read file as base64 and use original filename + mimetype from multer
      // This is critical — fromFilePath() uses the random temp name which has no extension,
      // causing WhatsApp to show "untitled" and fail to open the file.
      const fileData = fs.readFileSync(req.file.path).toString('base64');
      media = new MessageMedia(
        req.file.mimetype,
        fileData,
        req.file.originalname  // preserve original filename with extension
      );
    } catch (err) {
      console.error('Error attaching media:', err);
    }
  }

  const Campaign = require('../models/Campaign');
  const campaign = await Campaign.create({
    accountId,
    name: `Campaign ${new Date().toLocaleString()}`,
    groupId,
    message,
    hasMedia: !!media,
    totalTargets: finalNumbers.length
  });

  // Start background processing
  setTimeout(async () => {
    for (let num of finalNumbers) {
      if (!num || num.length < 5) continue;
      try {
        const formattedNum = num.replace(/\D/g, '') + '@c.us';
        
        // Always re-fetch client from the map — the original reference
        // can become stale after a QR reconnection (detached Frame error)
        let activeClient = clients.get(accountId);
        if (!activeClient) {
          throw new Error('Client disconnected during campaign');
        }
        
        let sentMsg;
        try {
          if (media) {
            sentMsg = await activeClient.sendMessage(formattedNum, media, { caption: message });
          } else {
            sentMsg = await activeClient.sendMessage(formattedNum, message);
          }
        } catch (frameErr) {
          // If the Puppeteer frame detached, try re-initializing once
          if (frameErr.message && frameErr.message.includes('detached Frame')) {
            console.warn(`[WhatsApp] Detached frame for account ${accountId}, re-initializing...`);
            clients.delete(accountId);
            activeClient = initializeClient(accountId);
            // Wait for client to become ready again (up to 30s)
            await new Promise((resolve) => setTimeout(resolve, 8000));
            activeClient = clients.get(accountId);
            if (!activeClient) throw new Error('Client failed to re-initialize');
            if (media) {
              sentMsg = await activeClient.sendMessage(formattedNum, media, { caption: message });
            } else {
              sentMsg = await activeClient.sendMessage(formattedNum, message);
            }
          } else {
            throw frameErr;
          }
        }
        
        campaign.sentCount++;
        campaign.recipients.push({
          number: num,
          status: 'sent',
          messageId: sentMsg.id._serialized
        });
        
        // Random delay to avoid quick bans (1-3 sec)
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      } catch (err) {
        console.error(`Failed to send to ${num}`, err.message);
        campaign.failCount++;
        campaign.recipients.push({
          number: num,
          status: 'failed',
          messageId: null
        });
      }
    }
    
    campaign.status = 'Completed';
    
    // Cleanup file
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch(e) {}
    }
  }, 0);

  res.json({ message: 'Campaign started successfully', campaign: campaign });
};

// Auto-initialize existing linked clients on server start
const resumeSessions = async () => {
  try {
    // We only resume Linked accounts
    const allAccounts = await WhatsAppAccount.accounts;
    const linkedAccounts = allAccounts.filter(a => a.isLinked);
    for (let acc of linkedAccounts) {
      console.log(`[WhatsApp Auto-Resume] Resuming session for account ${acc._id} (${acc.number})`);
      initializeClient(acc._id);
    }
  } catch (err) {
    console.error('Error auto-resuming WhatsApp sessions', err);
  }
};

module.exports = {
  getAccounts,
  createAccount,
  getQR,
  logoutWhatsApp,
  sendMessage,
  resumeSessions
};
