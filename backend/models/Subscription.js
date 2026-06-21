const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: true,
    unique: true
  },
  yearlyPrice: {
    type: Number,
    required: true
  },
  features: {
    type: [String],
    default: []
  },
  limits: {
    shops: { type: String, default: '1' },
    products: { type: String, default: '100' },
    stockLevels: { type: String, default: 'Basic' }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
