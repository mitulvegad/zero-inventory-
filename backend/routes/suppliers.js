const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const auth = require('../middleware/auth');

// @route   GET /api/suppliers
// @desc    Get all suppliers for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const suppliers = await Supplier.find({ user_id: req.user.id }).sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    console.error('Error fetching suppliers:', err.message);
    res.status(500).json({ message: 'Server error fetching suppliers' });
  }
});

// @route   POST /api/suppliers
// @desc    Create a new supplier
// @access  Private
router.post('/', auth, async (req, res) => {
  const {
    name,
    code,
    contact_person,
    designation,
    email,
    phone,
    alt_phone,
    website,
    address,
    country,
    state,
    city,
    pin_code,
    payment_terms,
    credit_limit,
    tax_id,
    notes,
    status
  } = req.body;

  if (!name || !code) {
    return res.status(400).json({ message: 'Supplier name and code are required' });
  }

  try {
    // Check if supplier code already exists for this user
    const existingCode = await Supplier.findOne({ user_id: req.user.id, code: code.trim() });
    if (existingCode) {
      return res.status(400).json({ message: 'A supplier with this code already exists' });
    }

    const newSupplier = new Supplier({
      user_id: req.user.id,
      name: name.trim(),
      code: code.trim(),
      contact_person: contact_person || '',
      designation: designation || '',
      email: email || '',
      phone: phone || '',
      alt_phone: alt_phone || '',
      website: website || '',
      address: address || '',
      country: country || '',
      state: state || '',
      city: city || '',
      pin_code: pin_code || '',
      payment_terms: payment_terms || '',
      credit_limit: credit_limit || 0,
      tax_id: tax_id || '',
      notes: notes || '',
      status: status || 'Active'
    });

    const supplier = await newSupplier.save();
    res.status(201).json(supplier);
  } catch (err) {
    console.error('Error creating supplier:', err.message);
    res.status(500).json({ message: 'Server error saving supplier' });
  }
});

// @route   PUT /api/suppliers/:id
// @desc    Update a supplier
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const {
    name,
    code,
    contact_person,
    designation,
    email,
    phone,
    alt_phone,
    website,
    address,
    country,
    state,
    city,
    pin_code,
    payment_terms,
    credit_limit,
    tax_id,
    notes,
    status
  } = req.body;

  if (!name || !code) {
    return res.status(400).json({ message: 'Supplier name and code are required' });
  }

  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Check user authorization
    if (supplier.user_id.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Check if supplier code already exists for this user (excluding this supplier)
    const existingCode = await Supplier.findOne({
      user_id: req.user.id,
      code: code.trim(),
      _id: { $ne: req.params.id }
    });
    if (existingCode) {
      return res.status(400).json({ message: 'A supplier with this code already exists' });
    }

    supplier.name = name.trim();
    supplier.code = code.trim();
    supplier.contact_person = contact_person || '';
    supplier.designation = designation || '';
    supplier.email = email || '';
    supplier.phone = phone || '';
    supplier.alt_phone = alt_phone || '';
    supplier.website = website || '';
    supplier.address = address || '';
    supplier.country = country || '';
    supplier.state = state || '';
    supplier.city = city || '';
    supplier.pin_code = pin_code || '';
    supplier.payment_terms = payment_terms || '';
    supplier.credit_limit = credit_limit || 0;
    supplier.tax_id = tax_id || '';
    supplier.notes = notes || '';
    supplier.status = status || 'Active';

    const updatedSupplier = await supplier.save();
    res.json(updatedSupplier);
  } catch (err) {
    console.error('Error updating supplier:', err.message);
    res.status(500).json({ message: 'Server error updating supplier' });
  }
});

// @route   DELETE /api/suppliers/:id
// @desc    Delete a supplier
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Check user authorization
    if (supplier.user_id.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    console.error('Error deleting supplier:', err.message);
    res.status(500).json({ message: 'Server error deleting supplier' });
  }
});

module.exports = router;
