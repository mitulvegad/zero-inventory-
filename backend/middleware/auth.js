const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from request header
  const token = req.header('x-auth-token');

  // Check if no token is provided
  if (!token) {
    return res.status(401).json({ message: 'No token found, authorization denied' });
  }

  // Verify the JWT token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Attach user payload ({ id: user.id }) to request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};
