const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

// @route   GET /api/customers
// @desc    Get all customers for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.find({ user_id: req.user.id }).sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err.message);
    res.status(500).json({ message: 'Server error fetching customers' });
  }
});

// @route   POST /api/customers
// @desc    Create a new customer
// @access  Private
router.post('/', auth, async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    city,
    state,
    country,
    zip_code,
    notes,
    status
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Customer name is required' });
  }

  try {
    // Check if customer name already exists for this user
    const existingCustomer = await Customer.findOne({ user_id: req.user.id, name: name.trim() });
    if (existingCustomer) {
      return res.status(400).json({ message: 'A customer with this name already exists' });
    }

    const newCustomer = new Customer({
      user_id: req.user.id,
      name: name.trim(),
      email: email || '',
      phone: phone || '',
      address: address || '',
      city: city || '',
      state: state || '',
      country: country || '',
      zip_code: zip_code || '',
      notes: notes || '',
      status: status || 'Active'
    });

    const customer = await newCustomer.save();
    res.status(201).json(customer);
  } catch (err) {
    console.error('Error creating customer:', err.message);
    res.status(500).json({ message: 'Server error saving customer' });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update a customer
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    city,
    state,
    country,
    zip_code,
    notes,
    status
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Customer name is required' });
  }

  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check user authorization
    if (customer.user_id.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Check if customer name already exists for this user (excluding this customer)
    const existingCustomer = await Customer.findOne({
      user_id: req.user.id,
      name: name.trim(),
      _id: { $ne: req.params.id }
    });
    if (existingCustomer) {
      return res.status(400).json({ message: 'A customer with this name already exists' });
    }

    customer.name = name.trim();
    customer.email = email || '';
    customer.phone = phone || '';
    customer.address = address || '';
    customer.city = city || '';
    customer.state = state || '';
    customer.country = country || '';
    customer.zip_code = zip_code || '';
    customer.notes = notes || '';
    customer.status = status || 'Active';

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (err) {
    console.error('Error updating customer:', err.message);
    res.status(500).json({ message: 'Server error updating customer' });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete a customer
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check user authorization
    if (customer.user_id.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('Error deleting customer:', err.message);
    res.status(500).json({ message: 'Server error deleting customer' });
  }
});

module.exports = router;
