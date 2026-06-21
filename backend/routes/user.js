const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Activity = require('../models/Activity');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP formats are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// @route   POST /api/user/upload-avatar
// @desc    Upload merchant profile avatar image
// @access  Private
router.post('/upload-avatar', auth, (req, res) => {
  upload.single('avatar')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Multer upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate local server file URL
      const fileUrl = `/uploads/${req.file.filename}`;
      user.avatar = fileUrl;
      await user.save();

      // Log activity timeline
      const activity = new Activity({
        userId: user._id,
        title: 'Profile Photo Updated',
        description: 'Successfully uploaded new profile avatar photo.',
        type: 'avatar_updated',
        timestamp: new Date()
      });
      await activity.save();

      res.json({
        success: true,
        message: 'Profile photo uploaded successfully!',
        avatar: fileUrl
      });
    } catch (dbErr) {
      console.error('Error saving avatar URL:', dbErr.message);
      res.status(500).json({ message: 'Server error saving avatar' });
    }
  });
});

// @route   DELETE /api/user/remove-avatar
// @desc    Remove current merchant profile avatar image
// @access  Private
router.delete('/remove-avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = '';
    await user.save();

    // Log activity timeline
    const activity = new Activity({
      userId: user._id,
      title: 'Profile Photo Removed',
      description: 'Profile avatar image has been cleared.',
      type: 'avatar_updated',
      timestamp: new Date()
    });
    await activity.save();

    res.json({
      success: true,
      message: 'Profile photo removed successfully!',
      avatar: ''
    });
  } catch (err) {
    console.error('Error removing avatar:', err.message);
    res.status(500).json({ message: 'Server error removing avatar' });
  }
});

// @route   POST /api/user/change-password
// @desc    Change password securely
// @access  Private
router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current password and new password are required' });
  }

  // Password Strength Regex Validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message: 'New password must be at least 8 characters long, and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&).'
    });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Fetch user headers and client details for audit logs
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';

    // Parse user agent simply for readability
    let browser = 'Unknown Browser';
    let device = 'Desktop';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';

    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      device = 'Mobile';
    }

    // Create Audit Log record
    const auditLog = new AuditLog({
      userId: user._id,
      action: 'PASSWORD_CHANGED',
      ipAddress: ip,
      device: device,
      browser: browser,
      timestamp: new Date()
    });
    await auditLog.save();

    // Create Activity Timeline record
    const activity = new Activity({
      userId: user._id,
      title: 'Password Changed',
      description: 'Your security password was successfully updated.',
      type: 'password_change',
      timestamp: new Date()
    });
    await activity.save();

    res.json({
      success: true,
      message: 'Security credentials updated successfully!'
    });
  } catch (err) {
    console.error('Password change error:', err.message);
    res.status(500).json({ message: 'Server error updating password' });
  }
});

// @route   POST /api/user/log-access-code
// @desc    Log activity when merchant views the SaaS Access Code
// @access  Private
router.post('/log-access-code', auth, async (req, res) => {
  try {
    const activity = new Activity({
      userId: req.user.id,
      title: 'SaaS Access Code Viewed',
      description: 'Viewed the merchant SaaS access code credential.',
      type: 'saas_code_viewed',
      timestamp: new Date()
    });
    await activity.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Access code logging error:', err.message);
    res.status(500).json({ message: 'Server error logging access code audit' });
  }
});

module.exports = router;
