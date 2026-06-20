const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
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
  code: {
    type: String,
    required: true,
    trim: true
  },
  contact_person: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  alt_phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  pin_code: {
    type: String,
    trim: true
  },
  payment_terms: {
    type: String,
    trim: true
  },
  credit_limit: {
    type: Number,
    default: 0.00
  },
  tax_id: {
    type: String,
    trim: true
  },
  notes: {
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

// Ensure Supplier Code is unique per user
SupplierSchema.index({ user_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Supplier', SupplierSchema);
