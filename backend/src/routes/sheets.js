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
 * Accepts ISO strings or date-only strings from the client.
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
 * Recalculate achievedQuantity and rowCount from actual rows.
 * This prevents drift from crashes or race conditions.
 */
function recalculateFromRows(sheet) {
  sheet.rowCount = sheet.rows.length;
  sheet.achievedQuantity = sheet.rows.reduce((sum, row) => {
    return sum + (Number(row.quantity) || 0);
  }, 0);
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
    imageUrl: sheet.imageUrl || '',
    status: sheet.status || 'Upcoming',
    customColumns: sheet.customColumns,
    targetQuantity: sheet.targetQuantity ?? 0,
    achievedQuantity: sheet.achievedQuantity ?? 0,
    rowCount: sheet.rowCount ?? 0,
    createdAt: sheet.createdAt,
    updatedAt: sheet.updatedAt,
  };
}

// ─── GET all sheets (with pagination) ───
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [sheets, totalCount] = await Promise.all([
      Sheet.find({}, sheetListProjection())
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

// ─── GET search rows by date ───
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
      {
        $addFields: {
          matchingRows: {
            $filter: {
              input: '$rows',
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
          'matchingRows.0': { $exists: true },
        },
      },
      {
        $project: {
          title: 1,
          status: 1,
          description: 1,
          customColumns: 1,
          rows: '$matchingRows',
        },
      },
    ]);

    res.json(
      results.map((sheet) => ({
        sheetId: sheet._id,
        sheetTitle: sheet.title,
        status: sheet.status || 'Upcoming',
        customColumns: sheet.customColumns || [],
        matchingRows: sheet.rows,
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
    const { title, description, imageUrl, customColumns, targetQuantity } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Sheet title is required' });
    }

    const sheet = await Sheet.create({
      title: title.trim(),
      description: description ? String(description).trim().slice(0, 300) : '',
      imageUrl: imageUrl ? String(imageUrl).trim() : '',
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

// ─── GET single sheet (with row pagination) ───
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));

    const sheet = await Sheet.findById(req.params.id).lean();
    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    // Sort rows by date descending
    const allRows = sheet.rows || [];
    allRows.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalRows = allRows.length;
    const start = (page - 1) * limit;
    const paginatedRows = allRows.slice(start, start + limit);

    res.json({
      ...sheet,
      rows: paginatedRows,
      rowPagination: {
        page,
        limit,
        totalCount: totalRows,
        totalPages: Math.ceil(totalRows / limit),
      },
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

// ─── PUT update sheet ───
router.put(
  '/:id',
  requireManager,
  validateObjectId('id'),
  validateSheetBody,
  async (req, res) => {
    try {
      const { title, description, imageUrl, customColumns } = req.body;
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
      if (customColumns !== undefined) {
        sheet.customColumns = customColumns;
      }

      await sheet.save();
      res.json(sheet);
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

// ─── POST add row ───
router.post(
  '/:sheetId/rows',
  requireManager,
  validateObjectId('sheetId'),
  validateRowBody,
  async (req, res) => {
    try {
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
        date: normalizeRowDate(date),
        quantity: qty,
        description: description || '',
        customValues: customMap,
      });

      // Recalculate from actual rows to prevent drift
      recalculateFromRows(sheet);

      await sheet.save();
      const newRow = sheet.rows[sheet.rows.length - 1];
      res.status(201).json(newRow);
    } catch (err) {
      console.error('Add row error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── PUT update row ───
router.put(
  '/:sheetId/rows/:rowId',
  requireManager,
  validateObjectId('sheetId', 'rowId'),
  validateRowBody,
  async (req, res) => {
    try {
      const { date, quantity, description, customValues } = req.body;
      const sheet = await Sheet.findById(req.params.sheetId);
      if (!sheet) {
        return res.status(404).json({ message: 'Sheet not found' });
      }

      const row = sheet.rows.id(req.params.rowId);
      if (!row) {
        return res.status(404).json({ message: 'Row not found' });
      }

      if (date !== undefined) row.date = normalizeRowDate(date);
      if (quantity !== undefined) row.quantity = Number(quantity);
      if (description !== undefined) row.description = description;

      if (customValues && typeof customValues === 'object') {
        const customMap = new Map();
        Object.entries(customValues).forEach(([key, value]) => {
          customMap.set(key, value != null ? String(value) : '');
        });
        row.customValues = customMap;
      }

      // Recalculate from actual rows to prevent drift
      recalculateFromRows(sheet);

      await sheet.save();
      res.json(row);
    } catch (err) {
      console.error('Update row error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── DELETE row ───
router.delete(
  '/:sheetId/rows/:rowId',
  requireManager,
  validateObjectId('sheetId', 'rowId'),
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

      const row = sheet.rows.id(req.params.rowId);
      if (!row) {
        return res.status(404).json({ message: 'Row not found' });
      }

      row.deleteOne();

      // Recalculate from actual rows to prevent drift
      recalculateFromRows(sheet);

      await sheet.save();
      res.json({ message: 'Row deleted successfully' });
    } catch (err) {
      console.error('Delete row error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
