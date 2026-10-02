const express = require('express');
const bcrypt = require('bcryptjs');
const Sheet = require('../models/Sheet');
const User = require('../models/User');
const {
  authenticate,
  verifyViewerSession,
  requireManager,
} = require('../middleware/authMiddleware');
const {
  validateObjectId,
  validateSheetBody,
  validateItemBody,
  validateRowBody,
  validateStatus,
  validatePasswordBody,
} = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, verifyViewerSession);

// ─── Helpers ───

async function verifyManagerPassword(userId, password) {
  const user = await User.findOne({ userId });
  if (!user || user.role !== 'manager') {
    return false;
  }
  return bcrypt.compare(password, user.password);
}

/**
 * Store row dates at UTC noon for the calendar day (YYYY-MM-DD).
 */
function normalizeRowDate(dateInput) {
  if (!dateInput) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0));
  }

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, d] = dateInput.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  }

  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12, 0, 0, 0)
  );
}

function sanitizeTimezone(tz) {
  if (typeof tz !== 'string' || !tz.trim()) return 'UTC';
  if (!/^[A-Za-z0-9_+\/-]+$/.test(tz.trim())) return 'UTC';
  return tz.trim();
}

/**
 * Recalculate achievedQuantity and rowCount from actual rows for an item.
 */
function recalculateItemFromRows(item) {
  item.rowCount = item.rows.length;
  item.achievedQuantity = item.rows.reduce((sum, row) => {
    return sum + (Number(row.quantity) || 0);
  }, 0);
}

/**
 * Build a sheet list item (no items/rows detail, just counts).
 */
function toListItem(sheet) {
  const items = sheet.items || [];
  const totalTarget = items.reduce((s, i) => s + (i.targetQuantity || 0), 0);
  const totalAchieved = items.reduce((s, i) => s + (i.achievedQuantity || 0), 0);
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.isCompleted).length;

  return {
    _id: sheet._id,
    title: sheet.title,
    description: sheet.description || '',
    imageUrl: sheet.imageUrl || '',
    status: sheet.status || 'Upcoming',
    totalItems,
    completedItems,
    totalTarget,
    totalAchieved,
    createdAt: sheet.createdAt,
    updatedAt: sheet.updatedAt,
  };
}

/**
 * Build an item summary (no rows).
 */
function toItemSummary(item) {
  return {
    _id: item._id,
    name: item.name,
    imageUrl: item.imageUrl || '',
    size: item.size || '',
    quality: item.quality || '',
    workerColumns: item.workerColumns || [],
    targetQuantity: item.targetQuantity || 0,
    achievedQuantity: item.achievedQuantity || 0,
    rowCount: item.rowCount || 0,
    isCompleted: item.isCompleted || false,
  };
}

// ═══════════════════════════════════════════
// ─── SHEET CRUD ───
// ═══════════════════════════════════════════

// ─── GET all sheets (with pagination) ───
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    // Exclude items.rows to keep the response lightweight
    const [sheets, totalCount] = await Promise.all([
      Sheet.find({}, { 'items.rows': 0 })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Sheet.countDocuments(),
    ]);

    res.json({
      data: sheets.map(toListItem),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error('Get sheets error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET search rows by date (across all items) ───
router.get('/search', async (req, res) => {
  try {
    const { date, tz } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ message: 'Valid date query param required (YYYY-MM-DD)' });
    }

    const timezone = sanitizeTimezone(tz);

    const results = await Sheet.aggregate([
      { $unwind: '$items' },
      {
        $addFields: {
          'items.matchingRows': {
            $filter: {
              input: '$items.rows',
              as: 'row',
              cond: {
                $eq: [
                  {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$$row.date',
                      timezone,
                    },
                  },
                  date,
                ],
              },
            },
          },
        },
      },
      {
        $match: {
          'items.matchingRows.0': { $exists: true },
        },
      },
      {
        $project: {
          sheetTitle: '$title',
          sheetStatus: '$status',
          itemName: '$items.name',
          itemId: '$items._id',
          workerColumns: '$items.workerColumns',
          rows: '$items.matchingRows',
        },
      },
    ]);

    res.json(
      results.map((r) => ({
        sheetId: r._id,
        sheetTitle: r.sheetTitle,
        status: r.sheetStatus || 'Upcoming',
        itemId: r.itemId,
        itemName: r.itemName,
        workerColumns: r.workerColumns || [],
        matchingRows: r.rows,
      }))
    );
  } catch (err) {
    console.error('Search sheets by date error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST create sheet ───
router.post('/', requireManager, validateSheetBody, async (req, res) => {
  try {
    const { title, description, imageUrl, items } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Sheet title is required' });
    }

    // Build initial items array
    const initialItems = [];
    if (Array.isArray(items)) {
      for (const item of items) {
        if (!item.name || !item.name.trim()) continue;
        initialItems.push({
          name: item.name.trim(),
          imageUrl: item.imageUrl ? String(item.imageUrl).trim() : '',
          size: item.size ? String(item.size).trim() : '',
          quality: item.quality ? String(item.quality).trim() : '',
          workerColumns: Array.isArray(item.workerColumns) ? item.workerColumns : [],
          targetQuantity:
            item.targetQuantity != null && item.targetQuantity !== ''
              ? Math.max(0, Number(item.targetQuantity) || 0)
              : 0,
          rows: [],
          rowCount: 0,
          achievedQuantity: 0,
          isCompleted: false,
        });
      }
    }

    const sheet = await Sheet.create({
      title: title.trim(),
      description: description ? String(description).trim().slice(0, 300) : '',
      imageUrl: imageUrl ? String(imageUrl).trim() : '',
      items: initialItems,
    });

    res.status(201).json(toListItem(sheet));
  } catch (err) {
    console.error('Create sheet error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET single sheet (returns item list, no rows) ───
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const sheet = await Sheet.findById(req.params.id, { 'items.rows': 0 }).lean();
    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    res.json({
      _id: sheet._id,
      title: sheet.title,
      description: sheet.description || '',
      imageUrl: sheet.imageUrl || '',
      status: sheet.status || 'Upcoming',
      items: (sheet.items || []).map(toItemSummary),
      createdAt: sheet.createdAt,
      updatedAt: sheet.updatedAt,
    });
  } catch (err) {
    console.error('Get sheet error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PATCH update status ───
router.patch(
  '/:id/status',
  requireManager,
  validateObjectId('id'),
  validateStatus,
  async (req, res) => {
    try {
      const { status } = req.body;

      const sheet = await Sheet.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true, timestamps: true }
      ).lean();

      if (!sheet) {
        return res.status(404).json({ message: 'Sheet not found' });
      }

      res.json(toListItem(sheet));
    } catch (err) {
      console.error('Update status error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── PUT update sheet metadata ───
router.put(
  '/:id',
  requireManager,
  validateObjectId('id'),
  validateSheetBody,
  async (req, res) => {
    try {
      const { title, description, imageUrl } = req.body;
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
      if (imageUrl !== undefined) {
        sheet.imageUrl = imageUrl ? String(imageUrl).trim() : '';
      }

      await sheet.save();
      res.json(toListItem(sheet));
    } catch (err) {
      console.error('Update sheet error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── DELETE sheet ───
router.delete(
  '/:id',
  requireManager,
  validateObjectId('id'),
  validatePasswordBody,
  async (req, res) => {
    try {
      const { password } = req.body;

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
  }
);

// ═══════════════════════════════════════════
// ─── ITEM CRUD ───
// ═══════════════════════════════════════════

// ─── POST add item to sheet ───
router.post(
  '/:sheetId/items',
  requireManager,
  validateObjectId('sheetId'),
  validateItemBody,
  async (req, res) => {
    try {
      const { name, imageUrl, size, quality, workerColumns, targetQuantity } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Item name is required' });
      }

      const sheet = await Sheet.findById(req.params.sheetId);
      if (!sheet) {
        return res.status(404).json({ message: 'Sheet not found' });
      }

      sheet.items.push({
        name: name.trim(),
        imageUrl: imageUrl ? String(imageUrl).trim() : '',
        size: size ? String(size).trim() : '',
        quality: quality ? String(quality).trim() : '',
        workerColumns: Array.isArray(workerColumns) ? workerColumns : [],
        targetQuantity:
          targetQuantity != null && targetQuantity !== ''
            ? Math.max(0, Number(targetQuantity) || 0)
            : 0,
        rows: [],
        rowCount: 0,
        achievedQuantity: 0,
        isCompleted: false,
      });

      await sheet.save();
      const newItem = sheet.items[sheet.items.length - 1];
      res.status(201).json(toItemSummary(newItem));
    } catch (err) {
      console.error('Add item error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── PUT update item ───
router.put(
  '/:sheetId/items/:itemId',
  requireManager,
  validateObjectId('sheetId', 'itemId'),
  validateItemBody,
  async (req, res) => {
    try {
      const { name, imageUrl, size, quality, workerColumns, targetQuantity, isCompleted } = req.body;

      const sheet = await Sheet.findById(req.params.sheetId);
      if (!sheet) {
        return res.status(404).json({ message: 'Sheet not found' });
      }

      const item = sheet.items.id(req.params.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      if (name !== undefined) item.name = name.trim();
      if (imageUrl !== undefined) item.imageUrl = imageUrl ? String(imageUrl).trim() : '';
      if (size !== undefined) item.size = String(size).trim();
      if (quality !== undefined) item.quality = String(quality).trim();
      if (workerColumns !== undefined) item.workerColumns = workerColumns;
      if (targetQuantity !== undefined) {
        item.targetQuantity = Math.max(0, Number(targetQuantity) || 0);
      }
      if (isCompleted !== undefined) item.isCompleted = Boolean(isCompleted);

      await sheet.save();
      res.json(toItemSummary(item));
    } catch (err) {
      console.error('Update item error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── DELETE item ───
router.delete(
  '/:sheetId/items/:itemId',
  requireManager,
  validateObjectId('sheetId', 'itemId'),
  validatePasswordBody,
  async (req, res) => {
    try {
      const { password } = req.body;

      const valid = await verifyManagerPassword(req.user.userId, password);
      if (!valid) {
        return res.status(401).json({ message: 'Incorrect password' });
      }

      const sheet = await Sheet.findById(req.params.sheetId);
      if (!sheet) {
        return res.status(404).json({ message: 'Sheet not found' });
      }

      const item = sheet.items.id(req.params.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      item.deleteOne();
      await sheet.save();
      res.json({ message: 'Item deleted successfully' });
    } catch (err) {
      console.error('Delete item error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── GET item with rows ───
router.get(
  '/:sheetId/items/:itemId',
  validateObjectId('sheetId', 'itemId'),
  async (req, res) => {
    try {
      const sheet = await Sheet.findById(req.params.sheetId).lean();
      if (!sheet) {
        return res.status(404).json({ message: 'Sheet not found' });
      }

      const item = (sheet.items || []).find(
        (i) => String(i._id) === req.params.itemId
      );
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      // Sort rows by date descending
      const allRows = item.rows || [];
      allRows.sort((a, b) => new Date(b.date) - new Date(a.date));

      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
      const totalRows = allRows.length;
      const start = (page - 1) * limit;
      const paginatedRows = allRows.slice(start, start + limit);

      res.json({
        _id: item._id,
        name: item.name,
        imageUrl: item.imageUrl || '',
        size: item.size || '',
        quality: item.quality || '',
        workerColumns: item.workerColumns || [],
        targetQuantity: item.targetQuantity || 0,
        achievedQuantity: item.achievedQuantity || 0,
        rowCount: item.rowCount || 0,
        isCompleted: item.isCompleted || false,
        rows: paginatedRows,
        sheetTitle: sheet.title,
        sheetId: sheet._id,
        sheetStatus: sheet.status,
        rowPagination: {
          page,
          limit,
          totalCount: totalRows,
          totalPages: Math.ceil(totalRows / limit),
        },
      });
    } catch (err) {
      console.error('Get item error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ═══════════════════════════════════════════
// ─── ITEM ROW CRUD ───
// ═══════════════════════════════════════════

// ─── POST add row to item ───
router.post(
  '/:sheetId/items/:itemId/rows',
  requireManager,
  validateObjectId('sheetId', 'itemId'),
  validateRowBody,
  async (req, res) => {
    try {
      const { date, quantity, description, workerValues } = req.body;
      const sheet = await Sheet.findById(req.params.sheetId);
      if (!sheet) {
        return res.status(404).json({ message: 'Sheet not found' });
      }

      const item = sheet.items.id(req.params.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      const workerMap = new Map();
      if (workerValues && typeof workerValues === 'object') {
        Object.entries(workerValues).forEach(([key, value]) => {
          workerMap.set(key, value != null ? String(value) : '');
        });
      }

      const qty = quantity != null ? Number(quantity) : 0;

      item.rows.push({
        date: normalizeRowDate(date),
        quantity: qty,
        description: description || '',
        workerValues: workerMap,
      });

      recalculateItemFromRows(item);

      await sheet.save();
      const newRow = item.rows[item.rows.length - 1];
      res.status(201).json(newRow);
    } catch (err) {
      console.error('Add row error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── PUT update row in item ───
router.put(
  '/:sheetId/items/:itemId/rows/:rowId',
  requireManager,
  validateObjectId('sheetId', 'itemId', 'rowId'),
  validateRowBody,
  async (req, res) => {
    try {
      const { date, quantity, description, workerValues } = req.body;
      const sheet = await Sheet.findById(req.params.sheetId);
      if (!sheet) {
        return res.status(404).json({ message: 'Sheet not found' });
      }

      const item = sheet.items.id(req.params.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      const row = item.rows.id(req.params.rowId);
      if (!row) {
        return res.status(404).json({ message: 'Row not found' });
      }

      if (date !== undefined) row.date = normalizeRowDate(date);
      if (quantity !== undefined) row.quantity = Number(quantity);
      if (description !== undefined) row.description = description;

      if (workerValues && typeof workerValues === 'object') {
        const workerMap = new Map();
        Object.entries(workerValues).forEach(([key, value]) => {
          workerMap.set(key, value != null ? String(value) : '');
        });
        row.workerValues = workerMap;
      }

      recalculateItemFromRows(item);

      await sheet.save();
      res.json(row);
    } catch (err) {
      console.error('Update row error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── DELETE row from item ───
router.delete(
  '/:sheetId/items/:itemId/rows/:rowId',
  requireManager,
  validateObjectId('sheetId', 'itemId', 'rowId'),
  validatePasswordBody,
  async (req, res) => {
    try {
      const { password } = req.body;

      const valid = await verifyManagerPassword(req.user.userId, password);
      if (!valid) {
        return res.status(401).json({ message: 'Incorrect password' });
      }

      const sheet = await Sheet.findById(req.params.sheetId);
      if (!sheet) {
        return res.status(404).json({ message: 'Sheet not found' });
      }

      const item = sheet.items.id(req.params.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      const row = item.rows.id(req.params.rowId);
      if (!row) {
        return res.status(404).json({ message: 'Row not found' });
      }

      row.deleteOne();
      recalculateItemFromRows(item);

      await sheet.save();
      res.json({ message: 'Row deleted successfully' });
    } catch (err) {
      console.error('Delete row error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
