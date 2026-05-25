const mongoose = require('mongoose');

const connection = {};

async function connectDB() {
  // Agar connection pehle se hai toh wahi use karein
  if (connection.isConnected) {
    return;
  }

  // Naya connection banayein
  const db = await mongoose.connect(process.env.MONGO_URI);
  connection.isConnected = db.connections[0].readyState;
}

module.exports = connectDB;