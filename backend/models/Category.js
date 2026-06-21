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
  icon: {
    type: String,
    default: 'fa-tag',
    trim: true
  },
  color: {
    type: String,
    default: '#0EA5E9',
    trim: true
  },
  image: {
    type: String,
    default: '',
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

// Compound index to ensure Category name and slug are unique per user
CategorySchema.index({ user_id: 1, name: 1 }, { unique: true });
CategorySchema.index({ user_id: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Category', CategorySchema);
