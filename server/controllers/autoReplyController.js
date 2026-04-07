const AutoReply = require('../models/AutoReply');

// @desc    Get all auto-reply rules for user
// @route   GET /api/autoreply/:userId
const getRules = async (req, res) => {
  const { userId } = req.params;
  const rules = await AutoReply.findByUserId(userId);
  res.json(rules);
};

// @desc    Create new auto-reply rule
// @route   POST /api/autoreply
const createRule = async (req, res) => {
  const { userId, accountId, keyword, matchType, replyText, isActive } = req.body;
  if (!userId || !keyword || !replyText) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const rule = await AutoReply.create({
    userId,
    accountId,
    keyword,
    matchType,
    replyText,
    isActive
  });

  res.status(201).json(rule);
};

// @desc    Update rule
// @route   PUT /api/autoreply/:id
const updateRule = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const updatedRule = await AutoReply.update(id, updates);
  if (!updatedRule) {
    return res.status(404).json({ message: 'Rule not found' });
  }
  
  res.json(updatedRule);
};

// @desc    Delete rule
// @route   DELETE /api/autoreply/:id
const deleteRule = async (req, res) => {
  const { id } = req.params;
  const success = await AutoReply.delete(id);
  
  if (!success) {
    return res.status(404).json({ message: 'Rule not found' });
  }
  
  res.json({ message: 'Rule deleted' });
};

module.exports = {
  getRules,
  createRule,
  updateRule,
  deleteRule
};
