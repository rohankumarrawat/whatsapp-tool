const express = require('express');
const router = express.Router();

const { authUser, registerUser } = require('../controllers/authController');
const { getQR, logoutWhatsApp, sendMessage } = require('../controllers/whatsappController');

// Auth Routes
router.post('/auth/login', authUser);
router.post('/auth/register', registerUser);

// WhatsApp Routes
router.get('/whatsapp/qr/:userId', getQR);
router.post('/whatsapp/logout', logoutWhatsApp);
router.post('/whatsapp/send', sendMessage);

module.exports = router;
