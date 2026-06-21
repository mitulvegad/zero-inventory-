const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');

// @route   GET /api/activity/timeline
// @desc    Get merchant activity log timeline feeds
// @access  Private
router.get('/timeline', auth, async (req, res) => {
  try {
    let timeline = await Activity.find({ userId: req.user.id }).sort({ timestamp: -1 });

    // Seed default timelines if empty
    if (timeline.length === 0) {
      const defaultActivities = [
        {
          userId: req.user.id,
          title: 'Merchant License Active',
          description: 'Software subscription license activated under Growth/Enterprise parameters.',
          type: 'plan_upgrade',
          timestamp: new Date(Date.now() - 86400000)
        },
        {
          userId: req.user.id,
          title: 'SaaS Account Registered',
          description: 'Merchant dashboard setup and API keys initialized.',
          type: 'login',
          timestamp: new Date(Date.now() - 172800000)
        }
      ];
      timeline = await Activity.insertMany(defaultActivities);
    }

    res.json(timeline);
  } catch (err) {
    console.error('Error fetching activity logs:', err.message);
    res.status(500).json({ message: 'Server error fetching activity logs' });
  }
});

module.exports = router;
