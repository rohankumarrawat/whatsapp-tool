class WhatsAppAccount {
  static accounts = [];
  static idCounter = 1;

  constructor({ userId, number = null, name = 'WhatsApp Account', isLinked = false }) {
    this._id = (WhatsAppAccount.idCounter++).toString();
    this.userId = userId;
    this.number = number;
    this.name = name;
    this.isLinked = isLinked;
    this.createdAt = new Date().toISOString();
  }

  static async create(data) {
    const newAccount = new WhatsAppAccount(data);
    this.accounts.push(newAccount);
    return newAccount;
  }

  static async findByUserId(userId) {
    return this.accounts.filter(a => a.userId === userId).map(a => ({ ...a }));
  }

  static async findById(id) {
    const account = this.accounts.find(a => a._id === id);
    return account ? { ...account } : null;
  }

  static async findByIdAndUpdate(id, update) {
    const accIndex = this.accounts.findIndex(a => a._id === id);
    if (accIndex !== -1) {
      Object.assign(this.accounts[accIndex], update);
      return { ...this.accounts[accIndex] };
    }
    return null;
  }

  static async findByIdAndDelete(id) {
    const accIndex = this.accounts.findIndex(a => a._id === id);
    if (accIndex !== -1) {
      this.accounts.splice(accIndex, 1);
      return true;
    }
    return false;
  }
}

module.exports = WhatsAppAccount;
