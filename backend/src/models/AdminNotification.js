const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "critical"],
      default: "info",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    audienceRoles: {
      type: [String],
      enum: ["all", "admin", "employer", "job_seeker"],
      default: ["all"],
    },
    acknowledgedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        acknowledgedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

adminNotificationSchema.index({ createdAt: -1 });
adminNotificationSchema.index({ audienceRoles: 1, isActive: 1 });
adminNotificationSchema.index({ "acknowledgedBy.user": 1 });

module.exports = mongoose.model("AdminNotification", adminNotificationSchema);
