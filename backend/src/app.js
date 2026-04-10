const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const applicationRoutes = require("./modules/application/application.routes");
const applicationNoteRoutes = require("./modules/applicationNote/applicationNote.routes");
const interviewScheduleRoutes = require("./modules/interviewSchedule/interviewSchedule.routes");
const swaggerSpec = require("./config/swagger");
const connectDBModule = require("./config/db");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = [
        process.env.CLIENT_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:5174",
      ];
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const mongooseReadyStateLabels = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

app.get("/health", (req, res) => {
  const readyState = mongoose.connection.readyState;
  const connected = readyState === 1;
  const mongoUri = connectDBModule.getMongoUri();
  res.status(200).json({
    status: "ok",
    message: "Job Board API healthy",
    database: {
      connected,
      state: mongooseReadyStateLabels[readyState] ?? String(readyState),
      mongoUriConfigured: Boolean(mongoUri),
      envSource: connectDBModule.mongoEnvSource(),
    },
  });
});

// Root URL (Railway / browser default) — API has no HTML homepage
app.get("/", (req, res) => {
  res.status(200).json({
    name: "CareerLink API",
    health: "/health",
    docs: "/api/docs",
    jobs: "/api/jobs",
  });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewScheduleRoutes);
app.use("/api/notifications", notificationRoutes);
// Includes nested routes: /api/applications/:applicationId/notes and /api/application-notes/:noteId
app.use("/api", applicationNoteRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorMiddleware);

module.exports = app;
