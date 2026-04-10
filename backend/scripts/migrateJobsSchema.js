/**
 * One-time migration: align existing `jobs` documents with the zip-style schema:
 * - employmentType: string -> string[]
 * - responsibilities / requirements: add "" if missing
 * - sync Mongoose indexes (including text index) with Job model
 *
 * Run from backend folder: npm run migrate:jobs
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Job = require("../src/models/Job");

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is missing in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const coll = mongoose.connection.collection("jobs");

  const stringToArray = await coll.updateMany(
    { employmentType: { $type: "string" } },
    [{ $set: { employmentType: ["$employmentType"] } }]
  );
  console.log(`employmentType string -> array: matched ${stringToArray.matchedCount}, modified ${stringToArray.modifiedCount}`);

  const fixMissingType = await coll.updateMany(
    {
      $or: [
        { employmentType: { $exists: false } },
        { employmentType: null },
        { employmentType: [] },
      ],
    },
    { $set: { employmentType: ["full-time"] } }
  );
  console.log(`employmentType missing/empty -> [full-time]: matched ${fixMissingType.matchedCount}, modified ${fixMissingType.modifiedCount}`);

  const addResp = await coll.updateMany({ responsibilities: { $exists: false } }, { $set: { responsibilities: "" } });
  console.log(`responsibilities default: matched ${addResp.matchedCount}, modified ${addResp.modifiedCount}`);

  const addReq = await coll.updateMany({ requirements: { $exists: false } }, { $set: { requirements: "" } });
  console.log(`requirements default: matched ${addReq.matchedCount}, modified ${addReq.modifiedCount}`);

  try {
    const dropped = await Job.syncIndexes();
    console.log("syncIndexes done. Indexes now match Job model.", dropped || "");
  } catch (err) {
    console.error("syncIndexes failed (you may need to drop an old text index in mongosh):", err.message);
    process.exitCode = 1;
  }

  await mongoose.disconnect();
  console.log("Migration finished.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
