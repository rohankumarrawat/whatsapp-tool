const bcrypt = require('bcryptjs');

class User {
  static users = [];
  static idCounter = 1;

  constructor(data) {
    Object.assign(this, data);
    this._id = this._id || (User.idCounter++).toString();
  }

  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  static async findOne(query) {
    if (query.email) {
      const u = this.users.find(u => u.email === query.email);
      return u ? new User(u) : null;
    }
    return null;
  }

  static async create(data) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const newUser = new User({
      ...data,
      password: hashedPassword,
      whatsappLinked: false,
      whatsappNumber: null,
      role: data.role || 'user'
    });
    this.users.push(newUser);
    return newUser;
  }

  static async findByIdAndUpdate(id, update) {
    const userIndex = this.users.findIndex(u => u._id === id);
    if (userIndex !== -1) {
      Object.assign(this.users[userIndex], update);
      return new User(this.users[userIndex]);
    }
    return null;
  }

  static async findById(id) {
    const user = this.users.find(u => u._id === id);
    return user ? new User(user) : null;
  }

  static async find(query) {
    if (query.whatsappLinked !== undefined) {
      return this.users.filter(u => u.whatsappLinked === query.whatsappLinked).map(u => new User(u));
    }
    return this.users.map(u => new User(u));
  }
}

module.exports = User;
