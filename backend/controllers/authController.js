const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate a random SaaS code formatted as ZIM-XXXX-XXXX
const generateSaasCode = async () => {
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    code = `ZIM-${part1}-${part2}`;
    
    const existingUser = await User.findOne({ saas_code: code });
    if (!existingUser) {
      isUnique = true;
    }
  }
  return code;
};

// @desc    Register a new merchant
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { email, password, plan_name } = req.body;

  try {
    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // 2. Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ message: 'Email already registered. Please login directly' });
    }

    // 3. Generate random SaaS access code
    const saas_code = await generateSaasCode();

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 5. Create and save user
    user = new User({
      email: email.toLowerCase(),
      password_hash,
      saas_code,
      plan_name: plan_name || 'Starter Shop'
    });

    await user.save();

    // 6. Return JWT and generated SaaS Code
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          token,
          saas_code,
          email: user.email,
          plan_name: user.plan_name,
          message: 'Registration successful! Your SaaS access code is generated.'
        });
      }
    );
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate merchant and get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password, saas_code } = req.body;

  try {
    // 1. Check fields
    if (!email || !password || !saas_code) {
      return res.status(400).json({ message: 'Email, password, and SaaS Code are required' });
    }

    // 2. Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. Please check your Email, Password, and SaaS Access Code' });
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Please check your Email, Password, and SaaS Access Code' });
    }

    // 4. Verify SaaS Access Code (case-insensitive)
    if (saas_code.toUpperCase() !== user.saas_code.toUpperCase()) {
      return res.status(400).json({ message: 'Invalid credentials. Please check your Email, Password, and SaaS Access Code' });
    }

    // 5. Generate and return JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            plan_name: user.plan_name,
            saas_code: user.saas_code
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user profile details
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err.message);
    res.status(500).json({ message: 'Server error fetching user details' });
  }
};
