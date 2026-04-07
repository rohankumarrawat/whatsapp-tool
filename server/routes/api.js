const express = require('express');
const router = express.Router();
const multer = require('multer');

const { authUser, registerUser } = require('../controllers/authController');
const { getAccounts, createAccount, getQR, logoutWhatsApp, sendMessage } = require('../controllers/whatsappController');
const { getGroups, createGroup, getContacts, uploadContacts, deleteContact } = require('../controllers/contactsController');
const { getCampaigns, getCampaignDetails } = require('../controllers/campaignController');
const { getRules, createRule, updateRule, deleteRule } = require('../controllers/autoReplyController');

const upload = multer({ dest: 'uploads/' });

// Auth Routes
router.post('/auth/login', authUser);
router.post('/auth/register', registerUser);

// WhatsApp Routes
router.get('/whatsapp/accounts/:userId', getAccounts);
router.post('/whatsapp/accounts', createAccount);
router.get('/whatsapp/qr/:accountId', getQR);
router.post('/whatsapp/logout', logoutWhatsApp);
router.post('/whatsapp/send', upload.single('media'), sendMessage);

// Contacts Routes
router.get('/contacts/groups/:userId', getGroups);
router.post('/contacts/groups', createGroup);
router.get('/contacts/:userId', getContacts);
router.post('/contacts/upload', upload.single('file'), uploadContacts);
router.delete('/contacts/:id', deleteContact);

// Campaign & Analytics Routes (specific paths first, params after!)
router.get('/campaigns/details/:campaignId', getCampaignDetails);
router.get('/campaigns/:userId', getCampaigns);

// Auto Reply Routes
router.get('/autoreply/:userId', getRules);
router.post('/autoreply', createRule);
router.put('/autoreply/:id', updateRule);
router.delete('/autoreply/:id', deleteRule);

module.exports = router;
