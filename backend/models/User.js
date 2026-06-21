const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  saas_code: {
    type: String,
    required: true,
    unique: true
  },
  // Alias for saasCode
  saasCode: {
    type: String
  },
  plan_name: {
    type: String,
    default: 'Starter Shop'
  },
  // Alias for currentPlan
  currentPlan: {
    type: String,
    default: 'Starter Shop'
  },
  plan_type: {
    type: String,
    enum: ['starter', 'growth', 'enterprise'],
    default: 'starter'
  },
  name: {
    type: String,
    default: 'Merchant Account'
  },
  avatar: {
    type: String,
    default: ''
  },
  billingCycle: {
    type: String,
    default: 'Yearly Renewal'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  licenseStatus: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Inactive', 'Suspended']
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'staff'],
    default: 'admin'
  },
  permissions: {
    type: [String],
    default: ['billing.read', 'billing.write', 'inventory.read', 'inventory.write', 'settings.read', 'settings.write']
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Sync aliases before saving
UserSchema.pre('save', function (next) {
  if (this.saas_code && !this.saasCode) {
    this.saasCode = this.saas_code;
  }
  if (this.plan_name && !this.currentPlan) {
    this.currentPlan = this.plan_name;
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
