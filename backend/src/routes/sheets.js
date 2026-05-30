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

function sheetListProjection() {
  return {
    rows: 0,
  };
}

function toListItem(sheet) {
  return {
    _id: sheet._id,
    title: sheet.title,
    description: sheet.description || '',
    status: sheet.status || 'Upcoming',
    customColumns: sheet.customColumns,
    targetQuantity: sheet.targetQuantity ?? 0,
    achievedQuantity: sheet.achievedQuantity ?? 0,
    rowCount: sheet.rowCount ?? 0,
    createdAt: sheet.createdAt,
    updatedAt: sheet.updatedAt,
  };
}

router.get('/', async (req, res) => {
  try {
    const sheets = await Sheet.find({}, sheetListProjection())
      .sort({ createdAt: -1 })
      .lean();

    res.json(sheets.map(toListItem));
  } catch (err) {
    console.error('Get sheets error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireManager, async (req, res) => {
  try {
    const { title, description, customColumns, targetQuantity } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Sheet title is required' });
    }

    const sheet = await Sheet.create({
      title: title.trim(),
      description: description ? String(description).trim().slice(0, 300) : '',
      customColumns: customColumns || [],
      targetQuantity:
        targetQuantity != null && targetQuantity !== ''
          ? Math.max(0, Number(targetQuantity) || 0)
          : 0,
      rows: [],
      rowCount: 0,
      achievedQuantity: 0,
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

    const sheet = await Sheet.findById(req.params.id).lean();
    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    res.json(sheet);
  } catch (err) {
    console.error('Get sheet error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', requireManager, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid sheet ID' });
    }

    const { status } = req.body;
    const allowed = ['Working', 'Completed', 'Upcoming'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const sheet = await Sheet.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    res.json(toListItem(sheet));
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', requireManager, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid sheet ID' });
    }

    const { title, description, customColumns } = req.body;
    const sheet = await Sheet.findById(req.params.id);
    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    if (title !== undefined) {
      sheet.title = title.trim();
    }
    if (description !== undefined) {
      sheet.description = String(description).trim().slice(0, 300);
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

    const qty = quantity != null ? Number(quantity) : 0;

    sheet.rows.push({
      date: date ? new Date(date) : new Date(),
      quantity: qty,
      description: description || '',
      customValues: customMap,
    });

    sheet.rowCount = (sheet.rowCount || 0) + 1;
    sheet.achievedQuantity = (sheet.achievedQuantity || 0) + qty;

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

    const oldQty = Number(row.quantity) || 0;

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

    const newQty = Number(row.quantity) || 0;
    sheet.achievedQuantity = (sheet.achievedQuantity || 0) + (newQty - oldQty);

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

    const qty = Number(row.quantity) || 0;
    row.deleteOne();
    sheet.rowCount = Math.max(0, (sheet.rowCount || 0) - 1);
    sheet.achievedQuantity = Math.max(0, (sheet.achievedQuantity || 0) - qty);

    await sheet.save();
    res.json({ message: 'Row deleted successfully' });
  } catch (err) {
    console.error('Delete row error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
