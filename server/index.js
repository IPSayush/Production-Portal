require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const seedUsers = require('./seed');
const authRoutes = require('./routes/auth');
const sheetRoutes = require('./routes/sheets');

const app = express();
const PORT = process.env.PORT || 5000;

// app.use(cors({ origin: '*' }));
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/sheets', sheetRoutes);

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not defined in .env');
      process.exit(1);
    }
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await seedUsers();
    console.log('User seed check complete');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
