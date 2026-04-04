const mongoose = require("mongoose");

async function connectDB() {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error("MONGO_URI is not configured in environment variables.");
  }

  await mongoose.connect(mongoURI, {
    autoIndex: true,
  });

  console.log("MongoDB connected successfully.");
}

module.exports = connectDB;
