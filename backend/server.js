require("dotenv").config();
const dns = require("dns");
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

/**
 * Connect to MongoDB after HTTP is listening so Railway/docker healthchecks
 * on GET /health can succeed even if DB is slow or misconfigured at boot.
 * Fix Atlas: allow 0.0.0.0/0 or Railway egress IPs; set MONGO_URI on the host.
 */
async function connectMongoWithDnsFallback() {
  try {
    await connectDB();
  } catch (error) {
    if (
      error &&
      error.code === "ECONNREFUSED" &&
      error.syscall === "querySrv"
    ) {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
      console.warn(
        "Primary DNS refused MongoDB SRV lookup. Retrying with public DNS..."
      );
      await connectDB();
    } else {
      throw error;
    }
  }
}

function startMongoInBackground() {
  connectMongoWithDnsFallback().catch((err) => {
    console.error("MongoDB connection failed (API will error until DB is reachable):", err.message);
  });
}

// Bind all interfaces (required in containers) before DB so /health responds.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend API listening on 0.0.0.0:${PORT}`);
  startMongoInBackground();
});
