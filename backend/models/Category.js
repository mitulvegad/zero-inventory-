const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true
  },
  parent_category: {
    type: String,
    default: null,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Inactive']
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure Category name is unique per user
CategorySchema.index({ user_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', CategorySchema);
