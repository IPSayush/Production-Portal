const mongoose = require('mongoose');

const rowSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  quantity: { type: Number, required: true, default: 0 },
  description: { type: String, default: '' },
  workerValues: {
    type: Map,
    of: String,
    default: {},
  },
  createdAt: { type: Date, default: Date.now },
});

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: '' },
  size: { type: String, default: '' },
  quality: { type: String, default: '' },
  workerColumns: { type: [String], default: [] },
  targetQuantity: { type: Number, default: 0 },
  achievedQuantity: { type: Number, default: 0 },
  rowCount: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  rows: [rowSchema],
});

const sheetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', maxlength: 300 },
    imageUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Working', 'Completed', 'Upcoming'],
      default: 'Upcoming',
    },
    items: [itemSchema],
  },
  { timestamps: true }
);

sheetSchema.index({ createdAt: -1 });
sheetSchema.index({ updatedAt: -1 });
sheetSchema.index({ status: 1 });
sheetSchema.index({ 'items.rows.date': 1 });

module.exports = mongoose.model('Sheet', sheetSchema);
