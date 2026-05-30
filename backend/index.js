require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const seedUsers = require('./src/seed');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await seedUsers();
  app.listen(PORT, () => console.log(`Server on port ${PORT}`));
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;
