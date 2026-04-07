class Campaign {
  static campaigns = [];
  static idCounter = 1;

  constructor({ accountId, name = 'Unnamed Campaign', groupId = null, message = '', hasMedia = false, totalTargets = 0 }) {
    this._id = (Campaign.idCounter++).toString();
    this.accountId = accountId;
    this.name = name;
    this.groupId = groupId;
    this.message = message;
    this.hasMedia = hasMedia;
    this.status = 'Sending'; // Sending, Completed
    
    // Stats tracking
    this.totalTargets = totalTargets;
    this.sentCount = 0;
    this.failCount = 0;
    this.deliveredCount = 0;
    this.readCount = 0;

    // Detailed tracking: { number: String, status: 'sent' | 'delivered' | 'read' | 'failed', messageId: String }
    this.recipients = [];
    
    this.createdAt = new Date().toISOString();
  }

  static async create(data) {
    const newCampaign = new Campaign(data);
    this.campaigns.push(newCampaign);
    return newCampaign;
  }

  static async findByAccountId(accountId) {
    return this.campaigns.filter(c => c.accountId === accountId);
  }

  static async findAll() {
    return this.campaigns;
  }

  static async findById(id) {
    return this.campaigns.find(c => c._id === id);
  }

  static async updateRecipientStatusByMessageId(messageId, status) {
    for (let c of this.campaigns) {
      const recipient = c.recipients.find(r => r.messageId === messageId);
      if (recipient) {
        // Prevent backward status updates (e.g. read -> delivered)
        const levels = { failed: 0, sent: 1, delivered: 2, read: 3 };
        if (levels[status] > levels[recipient.status]) {
          // Adjust stats
          if (status === 'delivered') c.deliveredCount++;
          if (status === 'read') c.readCount++;
          recipient.status = status;
        }
        return true;
      }
    }
    return false;
  }
}

module.exports = Campaign;
