const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const UserSubscription = require('../models/UserSubscription');
const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');

// @route   GET /api/subscriptions/plans
// @desc    Get all active subscription plans
// @access  Private
router.get('/plans', auth, async (req, res) => {
  try {
    let plans = await Subscription.find({ isActive: true });
    
    // Seed default plans if none exist in the database
    if (plans.length === 0) {
      const defaultPlans = [
        {
          planName: 'Starter Shop',
          yearlyPrice: 1999,
          features: ['1 Connected Shop', 'Up to 100 Products', 'Basic Stock Levels'],
          limits: { shops: '1', products: '100', stockLevels: 'Basic' }
        },
        {
          planName: 'Growth Shop',
          yearlyPrice: 9999,
          features: ['3 Connected Shops', 'Up to 1,000 Products', 'Live Stock Badges', 'Low Stock Email Alerts', 'Post Customer Testimonials'],
          limits: { shops: '3', products: '1000', stockLevels: 'Live' }
        },
        {
          planName: 'Enterprise Shop',
          yearlyPrice: 19999,
          features: ['Unlimited Connected Shops', 'Unlimited Products', 'Full Real-time Analytics', 'Custom API Integrations', 'Dedicated Database Server'],
          limits: { shops: 'Unlimited', products: 'Unlimited', stockLevels: 'Real-time' }
        }
      ];
      plans = await Subscription.insertMany(defaultPlans);
    }
    
    res.json(plans);
  } catch (err) {
    console.error('Error fetching subscription plans:', err.message);
    res.status(500).json({ message: 'Server error fetching subscription plans' });
  }
});

// @route   GET /api/subscriptions/current
// @desc    Get current user subscription and active plan details
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Default expiration setup (127 days remaining from registration date)
    const registeredDate = user.registeredAt || user.created_at || new Date();
    const expiryDate = new Date(registeredDate);
    expiryDate.setDate(expiryDate.getDate() + 365); // 1-year interval

    const now = new Date();
    const diffTime = Math.max(0, expiryDate - now);
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Retrieve active plan details
    const plan = await Subscription.findOne({ planName: user.plan_name });

    res.json({
      planName: user.plan_name,
      planType: user.plan_type,
      billingCycle: user.billingCycle || 'Yearly Renewal',
      merchantEmail: user.email,
      saasCode: user.saas_code || 'ZIM-TEST-CODE',
      expiryDate,
      daysRemaining,
      limits: plan ? plan.limits : { shops: '1', products: '100', stockLevels: 'Basic' },
      status: daysRemaining > 0 ? 'active' : 'expired'
    });
  } catch (err) {
    console.error('Error fetching current subscription:', err.message);
    res.status(500).json({ message: 'Server error fetching current subscription' });
  }
});

// Helper function to process plan updates
const processPlanUpdate = async (userId, targetPlanName, isUpgrade, res) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plan = await Subscription.findOne({ planName: targetPlanName });
    if (!plan) {
      return res.status(404).json({ message: 'Target plan not found' });
    }

    const oldPlanName = user.plan_name;
    user.plan_name = plan.planName;
    user.currentPlan = plan.planName;
    user.plan_type = plan.planName.toLowerCase().startsWith('starter') ? 'starter' :
                     plan.planName.toLowerCase().startsWith('growth') ? 'growth' : 'enterprise';

    await user.save();

    // Create an invoice record
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 365); // 1-year duration

    const newInvoice = new Invoice({
      userId: user._id,
      invoiceNumber,
      planName: plan.planName,
      amount: plan.yearlyPrice,
      paymentMethod: 'Stripe/Razorpay',
      status: 'Paid',
      billingDate: new Date(),
      expiryDate
    });
    await newInvoice.save();

    // Record user activity
    const activity = new Activity({
      userId: user._id,
      title: isUpgrade ? 'Plan Upgraded' : 'Plan Downgraded',
      description: `Successfully transitioned subscription from ${oldPlanName} to ${plan.planName}.`,
      type: isUpgrade ? 'plan_upgrade' : 'plan_downgrade',
      timestamp: new Date()
    });
    await activity.save();

    res.json({
      success: true,
      message: `Plan successfully updated to ${plan.planName}`,
      planName: plan.planName,
      planType: user.plan_type,
      invoice: newInvoice
    });
  } catch (err) {
    console.error('Error changing plan:', err.message);
    res.status(500).json({ message: 'Server error updating plan' });
  }
};

// @route   POST /api/subscriptions/upgrade
// @desc    Upgrade subscription plan
// @access  Private
router.post('/upgrade', auth, async (req, res) => {
  const { planName } = req.body;
  if (!planName) {
    return res.status(400).json({ message: 'Plan name is required' });
  }
  await processPlanUpdate(req.user.id, planName, true, res);
});

// @route   POST /api/subscriptions/downgrade
// @desc    Downgrade subscription plan
// @access  Private
router.post('/downgrade', auth, async (req, res) => {
  const { planName } = req.body;
  if (!planName) {
    return res.status(400).json({ message: 'Plan name is required' });
  }
  await processPlanUpdate(req.user.id, planName, false, res);
});

module.exports = router;
