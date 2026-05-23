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
    customColumns: { type: [String], default: [] },
    rows: [rowSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sheet', sheetSchema);
