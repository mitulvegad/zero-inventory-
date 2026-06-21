const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// @route   GET /api/categories
// @desc    Get all categories for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({ user_id: req.user.id }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, slug, parent_category, icon, color, image, description, status } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  // Auto-generate slug if not provided, or clean the provided one
  let finalSlug = slug || name;
  finalSlug = finalSlug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special chars
    .replace(/[\s_]+/g, '-')  // replace spaces/underscores with hyphens
    .replace(/-+/g, '-');     // replace duplicate hyphens

  try {
    // Check if category name or slug already exists for this user
    const existingName = await Category.findOne({ user_id: req.user.id, name: name.trim() });
    if (existingName) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }

    const existingSlug = await Category.findOne({ user_id: req.user.id, slug: finalSlug });
    if (existingSlug) {
      return res.status(400).json({ message: 'A category with this URL slug already exists' });
    }

    const newCategory = new Category({
      user_id: req.user.id,
      name: name.trim(),
      slug: finalSlug,
      parent_category: parent_category || null,
      icon: icon || 'fa-tag',
      color: color || '#0EA5E9',
      image: image || '',
      description: description || '',
      status: status || 'Active'
    });

    const category = await newCategory.save();
    res.status(201).json(category);
  } catch (err) {
    console.error('Error creating category:', err.message);
    res.status(500).json({ message: 'Server error saving category' });
  }
});

module.exports = router;
