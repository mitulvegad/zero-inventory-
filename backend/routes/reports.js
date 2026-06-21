const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// @route   GET /api/reports/sales-audit
// @desc    Get Sales Audit data
// @access  Private
router.get('/sales-audit', auth, async (req, res) => {
  try {
    const sales = await Sale.find({ user_id: req.user.id }).sort({ sale_date: -1 });
    
    // Group sales by day
    const dailyMap = {};
    sales.forEach(sale => {
      const dateStr = new Date(sale.sale_date).toISOString().split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          saleDate: dateStr,
          invoicesIssued: 0,
          totalDailyRevenue: 0
        };
      }
      dailyMap[dateStr].invoicesIssued += 1;
      dailyMap[dateStr].totalDailyRevenue += sale.grand_total;
    });

    const dailyAggregation = Object.values(dailyMap).sort((a, b) => b.saleDate.localeCompare(a.saleDate));
    res.json(dailyAggregation);
  } catch (err) {
    console.error('Error compiling sales audit report:', err.message);
    res.status(500).json({ message: 'Server error compiling sales audit report' });
  }
});

// @route   GET /api/reports/inventory-valuation
// @desc    Get Inventory Valuation data
// @access  Private
router.get('/inventory-valuation', auth, async (req, res) => {
  try {
    const products = await Product.find({ user_id: req.user.id }).populate('category_id');
    
    let totalInventoryValue = 0;
    let expectedSalesReturn = 0;

    const items = products.map(prod => {
      const cost = prod.purchase_price || 0;
      const price = prod.price || 0;
      const qty = prod.quantity || 0;
      
      const totalCostValue = qty * cost;
      const expectedValue = qty * price;
      
      totalInventoryValue += totalCostValue;
      expectedSalesReturn += expectedValue;

      const marginContribution = price > 0 ? ((price - cost) / price) * 100 : 0;

      return {
        id: prod._id,
        name: prod.name,
        sku: prod.sku,
        category: prod.category_id ? prod.category_id.name : 'Uncategorized',
        quantity: qty,
        purchaseCost: cost,
        totalCostValue: totalCostValue,
        sellingPrice: price,
        expectedValue: expectedValue,
        marginContribution: Math.round(marginContribution * 100) / 100
      };
    });

    const potentialProfit = expectedSalesReturn - totalInventoryValue;

    res.json({
      summary: {
        totalInventoryValue,
        expectedSalesReturn,
        potentialProfit
      },
      items
    });
  } catch (err) {
    console.error('Error compiling inventory valuation report:', err.message);
    res.status(500).json({ message: 'Server error compiling inventory valuation report' });
  }
});

// @route   GET /api/reports/purchase-log
// @desc    Get Purchase Log data
// @access  Private
router.get('/purchase-log', auth, async (req, res) => {
  try {
    const purchases = await Purchase.find({ user_id: req.user.id }).sort({ purchase_date: -1 });

    // Group purchases by day
    const dailyMap = {};
    purchases.forEach(p => {
      const dateStr = new Date(p.purchase_date).toISOString().split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          purchaseDate: dateStr,
          ordersCompleted: 0,
          totalCostOutflow: 0
        };
      }
      dailyMap[dateStr].ordersCompleted += 1;
      dailyMap[dateStr].totalCostOutflow += p.grand_total;
    });

    const dailyAggregation = Object.values(dailyMap).sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
    res.json(dailyAggregation);
  } catch (err) {
    console.error('Error compiling purchase log report:', err.message);
    res.status(500).json({ message: 'Server error compiling purchase log report' });
  }
});

module.exports = router;
