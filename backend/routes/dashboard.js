const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Category = require('../models/Category');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics, reports, alerts, and activities
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userIdObj = new mongoose.Types.ObjectId(req.user.id);

    // 1. Total Products Count
    const totalProducts = await Product.countDocuments({ user_id: req.user.id });

    // 2. Total Stock Value & Item Units
    const productStats = await Product.aggregate([
      { $match: { user_id: userIdObj } },
      { $group: {
          _id: null,
          totalStockValue: { $sum: { $multiply: ["$price", "$quantity"] } },
          totalUnits: { $sum: "$quantity" }
      }}
    ]);

    const totalStockValue = productStats.length > 0 ? productStats[0].totalStockValue : 0;
    const totalItemUnits = productStats.length > 0 ? productStats[0].totalUnits : 0;

    // 3. Low Stock Warns Count
    const lowStockWarns = await Product.countDocuments({
      user_id: req.user.id,
      $expr: { $lte: ["$quantity", "$reorder_level"] }
    });

    // 4. Category Distribution & Valuation
    const categoryValuation = await Product.aggregate([
      { $match: { user_id: userIdObj } },
      { $group: {
          _id: "$category_id",
          productsCount: { $sum: 1 },
          totalUnits: { $sum: "$quantity" },
          assetValuation: { $sum: { $multiply: ["$price", "$quantity"] } }
      }},
      { $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails"
      }},
      { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
      { $project: {
          categoryName: { $ifNull: ["$categoryDetails.name", "Uncategorized"] },
          productsCount: 1,
          totalUnits: 1,
          assetValuation: 1
      }},
      { $sort: { assetValuation: -1 } }
    ]);

    // 5. Monthly Revenue aggregation
    const monthlyRevenueRaw = await Sale.aggregate([
      { $match: { user_id: userIdObj } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$sale_date" } },
          invoicesCount: { $sum: 1 },
          revenue: { $sum: "$grand_total" }
      }},
      { $sort: { _id: -1 } },
      { $limit: 6 }
    ]);

    // Format monthly names (e.g. "2026-06" to "Jun 2026")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevenue = monthlyRevenueRaw.map(item => {
      const [year, monthStr] = item._id.split('-');
      const monthIdx = parseInt(monthStr, 10) - 1;
      return {
        month: `${monthNames[monthIdx]} ${year}`,
        invoices: item.invoicesCount,
        revenue: item.revenue
      };
    });

    // 6. Low Stock Alerts list
    const lowStockAlerts = await Product.find({
      user_id: req.user.id,
      $expr: { $lte: ["$quantity", "$reorder_level"] }
    }).populate('category_id', 'name').select('sku name quantity reorder_level unit').limit(5);

    // 7. Recent Activities (Sales and Purchases)
    const recentSales = await Sale.find({ user_id: req.user.id })
      .sort({ sale_date: -1 })
      .select('invoice_number customer_name grand_total sale_date')
      .limit(5);

    const recentPurchases = await Purchase.find({ user_id: req.user.id })
      .sort({ purchase_date: -1 })
      .select('purchase_number supplier_name grand_total purchase_date')
      .limit(5);

    res.json({
      stats: {
        totalProducts,
        totalStockValue,
        totalItemUnits,
        lowStockWarns
      },
      categoryValuation,
      monthlyRevenue,
      lowStockAlerts,
      recentActivity: {
        sales: recentSales,
        purchases: recentPurchases
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err.message);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
});

module.exports = router;
