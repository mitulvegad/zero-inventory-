const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true, // e.g., 'PASSWORD_CHANGED', 'LOGIN_SUCCESS', etc.
    default: 'PASSWORD_CHANGED'
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  device: {
    type: String,
    default: 'Unknown Device'
  },
  browser: {
    type: String,
    default: 'Unknown Browser'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
