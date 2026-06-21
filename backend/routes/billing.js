const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const User = require('../models/User');

// @route   GET /api/billing/history
// @desc    Get billing history invoices list
// @access  Private
router.get('/history', auth, async (req, res) => {
  const { status, search } = req.query;
  const filter = { userId: req.user.id };

  if (status && status !== 'All') {
    filter.status = status;
  }

  try {
    let invoices = await Invoice.find(filter).sort({ billingDate: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      invoices = invoices.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        inv.planName.toLowerCase().includes(searchLower) ||
        inv.paymentMethod.toLowerCase().includes(searchLower)
      );
    }

    // Seed mock invoices if none exist for a comprehensive list
    if (invoices.length === 0 && (!status || status === 'All' || status === 'Paid') && !search) {
      const mockInvoices = [
        {
          userId: req.user.id,
          invoiceNumber: `INV-9021-384`,
          planName: 'Enterprise Shop',
          amount: 19999.00,
          paymentMethod: 'Stripe',
          status: 'Paid',
          billingDate: new Date('2026-06-20T10:00:00Z'),
          expiryDate: new Date('2027-06-20T10:00:00Z')
        },
        {
          userId: req.user.id,
          invoiceNumber: `INV-8210-449`,
          planName: 'Growth Shop',
          amount: 9999.00,
          paymentMethod: 'Razorpay',
          status: 'Paid',
          billingDate: new Date('2025-06-20T09:30:00Z'),
          expiryDate: new Date('2026-06-20T09:30:00Z')
        },
        {
          userId: req.user.id,
          invoiceNumber: `INV-1204-582`,
          planName: 'Starter Shop',
          amount: 1999.00,
          paymentMethod: 'Stripe',
          status: 'Paid',
          billingDate: new Date('2024-06-20T11:15:00Z'),
          expiryDate: new Date('2025-06-20T11:15:00Z')
        }
      ];
      invoices = await Invoice.insertMany(mockInvoices);
    }

    res.json(invoices);
  } catch (err) {
    console.error('Error fetching billing history:', err.message);
    res.status(500).json({ message: 'Server error fetching billing history' });
  }
});

// @route   GET /api/billing/invoice/:id
// @desc    Download / View professional invoice details
// @access  Private
router.get('/invoice/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice record not found' });
    }

    // Verify authorized access
    if (invoice.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to view this invoice' });
    }

    const merchant = await User.findById(req.user.id);
    const taxRate = 18; // 18% GST/VAT standard
    const subtotal = invoice.amount / (1 + taxRate / 100);
    const taxAmount = invoice.amount - subtotal;

    // Send professional HTML print invoice template
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber} - Zero Inventory</title>
          <style>
            body { font-family: 'Inter', 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; background-color: #ffffff; }
            .invoice-box { max-width: 800px; margin: auto; padding: 0; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: 800; color: #0ea5e9; font-family: 'Outfit', sans-serif; display: flex; align-items: center; gap: 8px; }
            .logo-dot { width: 12px; height: 12px; background-color: #0ea5e9; border-radius: 50%; }
            .title { text-align: right; font-size: 28px; font-weight: 700; color: #0f172a; text-transform: uppercase; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .meta-table td { width: 50%; vertical-align: top; font-size: 13px; color: #475569; }
            .meta-table td strong { color: #0f172a; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px 8px; font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase; text-align: left; }
            .items-table td { border-bottom: 1px solid #f1f5f9; padding: 12px 8px; font-size: 13px; }
            .totals-table { width: 40%; float: right; border-collapse: collapse; margin-bottom: 40px; }
            .totals-table td { padding: 8px 4px; font-size: 13px; }
            .totals-table tr.grand-total td { font-size: 16px; font-weight: bold; color: #0ea5e9; border-top: 2px solid #e2e8f0; }
            .footer { clear: both; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; margin-top: 60px; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between;">
              <button onclick="window.print()" style="background-color: #0ea5e9; border: none; color: white; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">Print Invoice</button>
              <button onclick="window.close()" style="background-color: transparent; border: 1px solid #cbd5e1; color: #475569; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">Close Window</button>
            </div>
            
            <table class="header-table">
              <tr>
                <td>
                  <div class="logo">
                    <span class="logo-dot"></span>
                    Zero Inventory
                  </div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Premium Inventory SaaS Platform</div>
                </td>
                <td class="title">Invoice</td>
              </tr>
            </table>

            <table class="meta-table">
              <tr>
                <td>
                  <strong>Billed To:</strong><br/>
                  Merchant Account<br/>
                  Email: ${merchant ? merchant.email : 'N/A'}<br/>
                  SaaS Access Code: ${merchant ? merchant.saas_code : 'N/A'}
                </td>
                <td style="text-align: right;">
                  <strong>Invoice ID:</strong> #${invoice.invoiceNumber}<br/>
                  <strong>Billing Date:</strong> ${new Date(invoice.billingDate).toLocaleDateString()}<br/>
                  <strong>Renewal Due:</strong> ${new Date(invoice.expiryDate).toLocaleDateString()}<br/>
                  <strong>Status:</strong> <span style="color:#22c55e; font-weight:bold;">${invoice.status}</span>
                </td>
              </tr>
            </table>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Billing Period</th>
                  <th style="text-align: right;">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Zero Inventory SaaS - ${invoice.planName} Subscription</strong><br/>
                    <span style="font-size:11px; color:#64748b;">Annual subscription plan renewal license</span>
                  </td>
                  <td>1 Year (365 days)</td>
                  <td style="text-align: right; font-weight: bold;">₹${invoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>GST (18% inclusive):</td>
                <td style="text-align: right;">₹${taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="grand-total">
                <td>Total:</td>
                <td style="text-align: right;">₹${invoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </table>

            <div class="footer">
              Thank you for partnering with Zero Inventory Management System.<br/>
              For support or billing inquiries, please contact accounts@zeroinventory.com
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error generating PDF invoice view:', err.message);
    res.status(500).json({ message: 'Server error generating invoice template' });
  }
});

module.exports = router;
