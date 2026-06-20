const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// @route   GET /api/comments
// @desc    Get latest 6 reviews
// @access  Public
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find().sort({ created_at: -1 }).limit(6);
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
});

// @route   POST /api/comments
// @desc    Post feedback testimonial
// @access  Private
router.post('/', auth, async (req, res) => {
  const { shop_name, plan_name, comment_text, rating } = req.body;

  try {
    if (!shop_name || !plan_name || !comment_text || !rating) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newComment = new Comment({
      user_id: req.user.id,
      shop_name,
      plan_name,
      comment_text,
      rating: parseInt(rating)
    });

    const comment = await newComment.save();
    res.status(201).json(comment);
  } catch (err) {
    console.error('Error saving comment:', err.message);
    res.status(500).json({ message: 'Server error saving comment' });
  }
});

module.exports = router;
