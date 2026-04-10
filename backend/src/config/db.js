const mongoose = require("mongoose");

/**
 * Resolve Mongo connection string. Railway / Render often inject DATABASE_URL;
 * Atlas tutorials use MONGO_URI — support both (and MONGODB_URI).
 */
function getMongoUri() {
  const raw =
    process.env.MONGO_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI ||
    "";
  return String(raw).trim();
}

/** Which env key provides the URI (for /health diagnostics; no secret values). */
function mongoEnvSource() {
  if (String(process.env.MONGO_URI || "").trim()) return "MONGO_URI";
  if (String(process.env.DATABASE_URL || "").trim()) return "DATABASE_URL";
  if (String(process.env.MONGODB_URI || "").trim()) return "MONGODB_URI";
  return null;
}

async function connectDB() {
  const mongoURI = getMongoUri();
  if (!mongoURI) {
    throw new Error(
      "No MongoDB URI: set MONGO_URI or DATABASE_URL (or MONGODB_URI) in environment variables."
    );
  }

  await mongoose.connect(mongoURI, {
    autoIndex: true,
  });

  console.log("MongoDB connected successfully.");
}

module.exports = connectDB;
module.exports.getMongoUri = getMongoUri;
module.exports.mongoEnvSource = mongoEnvSource;
