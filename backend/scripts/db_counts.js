/* eslint-disable no-console */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");

  await mongoose.connect(process.env.MONGO_URI);
  const cols = await mongoose.connection.db.listCollections().toArray();
  const out = {};
  for (const c of cols) {
    out[c.name] = await mongoose.connection.db.collection(c.name).countDocuments();
  }
  console.log(JSON.stringify({ uri: process.env.MONGO_URI, collections: out }, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
