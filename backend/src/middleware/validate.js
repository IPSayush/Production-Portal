const mongoose = require('mongoose');

/**
 * Validate that a value is a valid MongoDB ObjectId.
 * Use as: validateObjectId('id') for req.params.id
 */
function validateObjectId(...paramNames) {
  return (req, res, next) => {
    for (const name of paramNames) {
      const value = req.params[name];
      if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({ message: `Invalid ${name} format` });
      }
    }
    next();
  };
}

/**
 * Validate sheet creation/update body fields.
 */
function validateSheetBody(req, res, next) {
  const { title, description } = req.body;

  // Title validation (required on creation, optional on update)
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Sheet title is required and must be a non-empty string' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ message: 'Sheet title must be 200 characters or less' });
    }
  }

  // Description validation
  if (description !== undefined) {
    if (typeof description !== 'string') {
      return res.status(400).json({ message: 'Description must be a string' });
    }
    if (description.length > 300) {
      return res.status(400).json({ message: 'Description must be 300 characters or less' });
    }
  }

  next();
}

/**
 * Validate item creation/update body fields.
 */
function validateItemBody(req, res, next) {
  const { name, size, quality, workerColumns, targetQuantity } = req.body;

  // Name validation
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Item name is required and must be a non-empty string' });
    }
    if (name.trim().length > 200) {
      return res.status(400).json({ message: 'Item name must be 200 characters or less' });
    }
  }

  // Size validation
  if (size !== undefined && typeof size !== 'string') {
    return res.status(400).json({ message: 'Size must be a string' });
  }

  // Quality validation
  if (quality !== undefined && typeof quality !== 'string') {
    return res.status(400).json({ message: 'Quality must be a string' });
  }

  // Worker columns validation
  if (workerColumns !== undefined) {
    if (!Array.isArray(workerColumns)) {
      return res.status(400).json({ message: 'workerColumns must be an array' });
    }
    for (let i = 0; i < workerColumns.length; i++) {
      if (typeof workerColumns[i] !== 'string' || !workerColumns[i].trim()) {
        return res.status(400).json({ message: `workerColumns[${i}] must be a non-empty string` });
      }
    }
  }

  // Target quantity validation
  if (targetQuantity !== undefined && targetQuantity !== null && targetQuantity !== '') {
    const num = Number(targetQuantity);
    if (!Number.isFinite(num) || num < 0) {
      return res.status(400).json({ message: 'targetQuantity must be a non-negative number' });
    }
  }

  next();
}

/**
 * Validate row creation/update body fields.
 */
function validateRowBody(req, res, next) {
  const { date, quantity, description, workerValues } = req.body;

  // Date validation
  if (date !== undefined) {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
  }

  // Quantity validation
  if (quantity !== undefined && quantity !== null) {
    const num = Number(quantity);
    if (!Number.isFinite(num)) {
      return res.status(400).json({ message: 'Quantity must be a valid number' });
    }
  }

  // Description validation
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ message: 'Description must be a string' });
  }

  // Worker values validation
  if (workerValues !== undefined && workerValues !== null) {
    if (typeof workerValues !== 'object' || Array.isArray(workerValues)) {
      return res.status(400).json({ message: 'workerValues must be an object' });
    }
    for (const [key, value] of Object.entries(workerValues)) {
      if (typeof key !== 'string') {
        return res.status(400).json({ message: 'workerValues keys must be strings' });
      }
      if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') {
        return res.status(400).json({ message: 'workerValues values must be strings or numbers' });
      }
    }
  }

  next();
}

/**
 * Validate login body fields.
 */
function validateLoginBody(req, res, next) {
  const { userId, password, role } = req.body;

  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Password is required' });
  }
  if (!role || !['manager', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Role must be either "manager" or "viewer"' });
  }

  next();
}

/**
 * Validate status update body.
 */
function validateStatus(req, res, next) {
  const { status } = req.body;
  const allowed = ['Working', 'Completed', 'Upcoming'];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
  }
  next();
}

/**
 * Validate that password is provided in body (for delete confirmations).
 */
function validatePasswordBody(req, res, next) {
  const { password } = req.body;
  if (!password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ message: 'Password is required for this action' });
  }
  next();
}

module.exports = {
  validateObjectId,
  validateSheetBody,
  validateItemBody,
  validateRowBody,
  validateLoginBody,
  validateStatus,
  validatePasswordBody,
};
