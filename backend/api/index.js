const app = require('../src/app');
const connectDB = require('../src/config/db');
const seedUsers = require('../src/seed');

// Track if seed has already run in this serverless instance
let seeded = false;

// Serverless function handler
module.exports = async (req, res) => {
  try {
    // Connect to Database (cached after first call)
    await connectDB();

    // Run Seed Logic only once per cold start
    if (!seeded) {
      await seedUsers();
      seeded = true;
    }

    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};