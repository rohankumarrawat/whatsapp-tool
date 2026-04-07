class Group {
  static groups = [];
  static idCounter = 1;

  constructor({ userId, name, description = '' }) {
    this._id = (Group.idCounter++).toString();
    this.userId = userId;
    this.name = name;
    this.description = description;
    this.createdAt = new Date().toISOString();
  }

  static async create(data) {
    const newGroup = new Group(data);
    this.groups.push(newGroup);
    return newGroup;
  }

  static async findByUserId(userId) {
    return this.groups.filter(g => g.userId === userId).map(g => ({ ...g }));
  }

  static async findById(id) {
    const group = this.groups.find(g => g._id === id);
    return group ? { ...group } : null;
  }
}

module.exports = Group;
