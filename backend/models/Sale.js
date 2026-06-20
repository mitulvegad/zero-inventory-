const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  tax_rate: {
    type: Number,
    default: 0.00
  }
}, { _id: false });

const SaleSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoice_number: {
    type: String,
    required: true
  },
  customer_name: {
    type: String,
    required: true
  },
  sale_date: {
    type: Date,
    default: Date.now
  },
  grand_total: {
    type: Number,
    required: true
  },
  payment_method: {
    type: String,
    required: true
  },
  items: [SaleItemSchema],
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Index to find sales per user quickly
SaleSchema.index({ user_id: 1, invoice_number: 1 }, { unique: true });

module.exports = mongoose.model('Sale', SaleSchema);
