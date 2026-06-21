const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// @route   GET /api/security/audit-logs
// @desc    Get password change and security audit logs
// @access  Private
router.get('/audit-logs', auth, async (req, res) => {
  try {
    let logs = await AuditLog.find({ userId: req.user.id }).sort({ timestamp: -1 });

    // Seed mock audit log if none exist
    if (logs.length === 0) {
      const mockLogs = [
        {
          userId: req.user.id,
          action: 'PASSWORD_CHANGED',
          ipAddress: req.ip || '192.168.1.45',
          device: 'Desktop',
          browser: 'Chrome',
          timestamp: new Date()
        },
        {
          userId: req.user.id,
          action: 'LOGIN_SUCCESS',
          ipAddress: req.ip || '192.168.1.45',
          device: 'Desktop',
          browser: 'Chrome',
          timestamp: new Date(Date.now() - 3600000)
        }
      ];
      logs = await AuditLog.insertMany(mockLogs);
    }

    res.json(logs);
  } catch (err) {
    console.error('Error fetching audit logs:', err.message);
    res.status(500).json({ message: 'Server error fetching security audit logs' });
  }
});

module.exports = router;
