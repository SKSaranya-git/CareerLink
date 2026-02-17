require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Backend API running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
