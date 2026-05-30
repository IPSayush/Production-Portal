const mongoose = require('mongoose');

const rowSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  quantity: { type: Number, required: true, default: 0 },
  description: { type: String, default: '' },
  customValues: {
    type: Map,
    of: String,
    default: {},
  },
  createdAt: { type: Date, default: Date.now },
});

const sheetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', maxlength: 300 },
    status: {
      type: String,
      enum: ['Working', 'Completed', 'Upcoming'],
      default: 'Upcoming',
    },
    targetQuantity: { type: Number, default: 0 },
    achievedQuantity: { type: Number, default: 0 },
    rowCount: { type: Number, default: 0 },
    customColumns: { type: [String], default: [] },
    rows: [rowSchema],
  },
  { timestamps: true }
);

sheetSchema.index({ createdAt: -1 });
sheetSchema.index({ status: 1 });

module.exports = mongoose.model('Sheet', sheetSchema);
