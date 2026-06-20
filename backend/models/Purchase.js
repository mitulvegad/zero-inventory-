const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purchase_number: {
    type: String,
    required: true
  },
  supplier_name: {
    type: String,
    required: true
  },
  purchase_date: {
    type: Date,
    default: Date.now
  },
  grand_total: {
    type: Number,
    required: true
  },
  payment_status: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Index to locate purchase records quickly
PurchaseSchema.index({ user_id: 1, purchase_number: 1 }, { unique: true });

module.exports = mongoose.model('Purchase', PurchaseSchema);
