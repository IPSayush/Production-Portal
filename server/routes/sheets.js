const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Sheet = require('../models/Sheet');
const User = require('../models/User');
const {
  authenticate,
  verifyViewerSession,
  requireManager,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate, verifyViewerSession);

async function verifyManagerPassword(userId, password) {
  const user = await User.findOne({ userId });
  if (!user || user.role !== 'manager') {
    return false;
  }
  return bcrypt.compare(password, user.password);
}

router.get('/', async (req, res) => {
  try {
    const sheets = await Sheet.find()
      .select('title customColumns rows createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    const result = sheets.map((sheet) => ({
      _id: sheet._id,
      title: sheet.title,
      customColumns: sheet.customColumns,
      rowCount: sheet.rows ? sheet.rows.length : 0,
      createdAt: sheet.createdAt,
      updatedAt: sheet.updatedAt,
    }));

    res.json(result);
  } catch (err) {
    console.error('Get sheets error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireManager, async (req, res) => {
  try {
    const { title, customColumns } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Sheet title is required' });
    }

    const sheet = await Sheet.create({
      title: title.trim(),
      customColumns: customColumns || [],
      rows: [],
    });

    res.status(201).json(sheet);
  } catch (err) {
    console.error('Create sheet error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid sheet ID' });
    }

    const sheet = await Sheet.findById(req.params.id);
    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    res.json(sheet);
  } catch (err) {
    console.error('Get sheet error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', requireManager, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid sheet ID' });
    }

    const { title, customColumns } = req.body;
    const sheet = await Sheet.findById(req.params.id);
    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    if (title !== undefined) {
      sheet.title = title.trim();
    }
    if (customColumns !== undefined) {
      sheet.customColumns = customColumns;
    }

    await sheet.save();
    res.json(sheet);
  } catch (err) {
    console.error('Update sheet error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', requireManager, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid sheet ID' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const valid = await verifyManagerPassword(req.user.userId, password);
    if (!valid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const sheet = await Sheet.findByIdAndDelete(req.params.id);
    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    res.json({ message: 'Sheet deleted successfully' });
  } catch (err) {
    console.error('Delete sheet error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:sheetId/rows', requireManager, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.sheetId)) {
      return res.status(400).json({ message: 'Invalid sheet ID' });
    }

    const { date, quantity, description, customValues } = req.body;
    const sheet = await Sheet.findById(req.params.sheetId);
    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    const customMap = new Map();
    if (customValues && typeof customValues === 'object') {
      Object.entries(customValues).forEach(([key, value]) => {
        customMap.set(key, value != null ? String(value) : '');
      });
    }

    sheet.rows.push({
      date: date ? new Date(date) : new Date(),
      quantity: quantity != null ? Number(quantity) : 0,
      description: description || '',
      customValues: customMap,
    });

    await sheet.save();
    const newRow = sheet.rows[sheet.rows.length - 1];
    res.status(201).json(newRow);
  } catch (err) {
    console.error('Add row error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:sheetId/rows/:rowId', requireManager, async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.sheetId) ||
      !mongoose.Types.ObjectId.isValid(req.params.rowId)
    ) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const { date, quantity, description, customValues } = req.body;
    const sheet = await Sheet.findById(req.params.sheetId);
    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    const row = sheet.rows.id(req.params.rowId);
    if (!row) {
      return res.status(404).json({ message: 'Row not found' });
    }

    if (date !== undefined) row.date = new Date(date);
    if (quantity !== undefined) row.quantity = Number(quantity);
    if (description !== undefined) row.description = description;

    if (customValues && typeof customValues === 'object') {
      const customMap = new Map();
      Object.entries(customValues).forEach(([key, value]) => {
        customMap.set(key, value != null ? String(value) : '');
      });
      row.customValues = customMap;
    }

    await sheet.save();
    res.json(row);
  } catch (err) {
    console.error('Update row error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:sheetId/rows/:rowId', requireManager, async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.sheetId) ||
      !mongoose.Types.ObjectId.isValid(req.params.rowId)
    ) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const valid = await verifyManagerPassword(req.user.userId, password);
    if (!valid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const sheet = await Sheet.findById(req.params.sheetId);
    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    const row = sheet.rows.id(req.params.rowId);
    if (!row) {
      return res.status(404).json({ message: 'Row not found' });
    }

    row.deleteOne();
    await sheet.save();
    res.json({ message: 'Row deleted successfully' });
  } catch (err) {
    console.error('Delete row error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
