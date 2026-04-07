const fs = require('fs');
const csv = require('csv-parser');
const Group = require('../models/Group');
const Contact = require('../models/Contact');

// @desc    Get all groups for a user
// @route   GET /api/contacts/groups/:userId
const getGroups = async (req, res) => {
  try {
    const groups = await Group.findByUserId(req.params.userId);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching groups' });
  }
};

// @desc    Create a new group
// @route   POST /api/contacts/groups
const createGroup = async (req, res) => {
  const { userId, name, description } = req.body;
  if (!userId || !name) return res.status(400).json({ message: 'User ID and Group Name required' });
  
  try {
    const group = await Group.create({ userId, name, description });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating group' });
  }
};

// @desc    Get contacts for a user
// @route   GET /api/contacts/:userId
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.findByUserId(req.params.userId);
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching contacts' });
  }
};

// @desc    Upload CSV/Excel of contacts
// @route   POST /api/contacts/upload
const uploadContacts = async (req, res) => {
  const { userId, groupId } = req.body;
  
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  const results = [];
  try {
    // Basic CSV parsing
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        // Assume CSV has 'name' and 'number' or 'phone' columns
        const name = data.name || data.Name || data.NAME || '';
        const number = data.number || data.Number || data.phone || data.Phone || '';
        
        if (number) {
          results.push({ userId, name, number, groupId: groupId || null });
        }
      })
      .on('end', async () => {
        // Insert contacts
        if (results.length > 0) {
          await Contact.insertMany(results);
        }
        // Cleanup file
        fs.unlinkSync(req.file.path);
        
        res.status(200).json({ message: `Successfully imported ${results.length} contacts`, count: results.length });
      })
      .on('error', (err) => {
        console.error('CSV Parsing error:', err);
        res.status(500).json({ message: 'Error parsing CSV file' });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error processing file' });
  }
};

// @desc    Delete a contact
// @route   DELETE /api/contacts/:id
const deleteContact = async (req, res) => {
  try {
    const success = await Contact.deleteById(req.params.id);
    if (!success) return res.status(404).json({ message: 'Contact not found' });
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting contact' });
  }
};

module.exports = {
  getGroups,
  createGroup,
  getContacts,
  uploadContacts,
  deleteContact
};
