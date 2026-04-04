require("dotenv").config();
const dns = require("dns");
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();
  } catch (error) {
    // Some local resolvers refuse SRV lookups used by mongodb+srv URLs.
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

  app.listen(PORT, () => {
    console.log(`Backend API running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
