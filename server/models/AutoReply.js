class AutoReply {
  static rules = [];
  static idCounter = 1;

  constructor({ userId, accountId = null, keyword, matchType = 'exact', replyText = '', isActive = true }) {
    this._id = (AutoReply.idCounter++).toString();
    this.userId = userId;
    this.accountId = accountId; // If null, applies to all accounts for user
    this.keyword = keyword.toLowerCase();
    this.matchType = matchType; // 'exact', 'contains', 'startsWith'
    this.replyText = replyText;
    this.isActive = isActive;
    this.createdAt = new Date().toISOString();
  }

  static async create(data) {
    const newRule = new AutoReply(data);
    this.rules.push(newRule);
    return newRule;
  }

  static async findByUserId(userId) {
    return this.rules.filter(rule => rule.userId === userId);
  }

  static async findById(id) {
    return this.rules.find(rule => rule._id === id);
  }

  static async update(id, updates) {
    const rule = await this.findById(id);
    if (!rule) return null;
    
    if (updates.keyword) rule.keyword = updates.keyword.toLowerCase();
    if (updates.matchType) rule.matchType = updates.matchType;
    if (updates.replyText !== undefined) rule.replyText = updates.replyText;
    if (updates.isActive !== undefined) rule.isActive = updates.isActive;
    
    return rule;
  }

  static async delete(id) {
    const index = this.rules.findIndex(rule => rule._id === id);
    if (index === -1) return false;
    this.rules.splice(index, 1);
    return true;
  }
}

module.exports = AutoReply;
