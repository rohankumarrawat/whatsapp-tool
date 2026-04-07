const Campaign = require('../models/Campaign');
const WhatsAppAccount = require('../models/WhatsAppAccount');

// @desc    Get all campaigns for a user
// @route   GET /api/campaigns/:userId
const getCampaigns = async (req, res) => {
  const { userId } = req.params;
  
  // Find all accounts for user
  const accounts = await WhatsAppAccount.findByUserId(userId);
  const accountIds = accounts.map(a => a._id);

  const allCampaigns = await Campaign.findAll();
  
  // Filter campaigns belonging to user's accounts
  const userCampaigns = allCampaigns.filter(c => accountIds.includes(c.accountId));
  
  // Clean up responses to avoid too much data, maybe just return meta details
  res.json(userCampaigns.map(c => ({
    _id: c._id,
    name: c.name,
    status: c.status,
    createdAt: c.createdAt,
    totalTargets: c.totalTargets,
    sentCount: c.sentCount,
    failCount: c.failCount,
    deliveredCount: c.deliveredCount,
    readCount: c.readCount
  })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
};

// @desc    Get details for a specific campaign (including recipients)
// @route   GET /api/campaigns/details/:campaignId
const getCampaignDetails = async (req, res) => {
  const { campaignId } = req.params;
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    return res.status(404).json({ message: 'Campaign not found' });
  }
  res.json(campaign);
};

module.exports = {
  getCampaigns,
  getCampaignDetails
};
