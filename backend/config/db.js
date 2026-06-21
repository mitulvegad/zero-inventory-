const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to use Google's Public DNS servers to resolve MongoDB SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  console.warn('DNS server configuration failed, using default resolution:', err.message);
}

// Fix for Node 18+ DNS SRV resolution issues on IPv6/dual-stack networks
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
