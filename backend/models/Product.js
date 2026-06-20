const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  brand: {
    type: String,
    trim: true
  },
  purchase_price: {
    type: Number,
    default: 0.00
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  reorder_level: {
    type: Number,
    default: 10
  },
  unit: {
    type: String,
    default: 'Piece'
  },
  tax_rate: {
    type: Number,
    default: 0.00
  },
  description: {
    type: String,
    trim: true
  },
  image_url: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Ensure SKU is unique per tenant
ProductSchema.index({ user_id: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', ProductSchema);
