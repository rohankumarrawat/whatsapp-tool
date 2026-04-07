class Contact {
  static contacts = [];
  static idCounter = 1;

  constructor({ userId, name, number, groupId = null }) {
    this._id = (Contact.idCounter++).toString();
    this.userId = userId;
    this.name = name;
    this.number = number;
    this.groupId = groupId; // Link to a Group
    this.createdAt = new Date().toISOString();
  }

  static async create(data) {
    const newContact = new Contact(data);
    this.contacts.push(newContact);
    return newContact;
  }

  static async insertMany(dataArray) {
    const newContacts = dataArray.map(data => new Contact(data));
    this.contacts.push(...newContacts);
    return newContacts;
  }

  static async findByUserId(userId) {
    return this.contacts.filter(c => c.userId === userId).map(c => ({ ...c }));
  }

  static async findByGroup(groupId) {
    return this.contacts.filter(c => c.groupId === groupId).map(c => ({ ...c }));
  }

  static async deleteById(id) {
    const index = this.contacts.findIndex(c => c._id === id);
    if (index !== -1) {
      this.contacts.splice(index, 1);
      return true;
    }
    return false;
  }
}

module.exports = Contact;
