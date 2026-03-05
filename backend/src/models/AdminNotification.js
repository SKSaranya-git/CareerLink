const mongoose = require("mongoose");
const { ROLES } = require("../utils/constants");

const notificationSchema = new mongoose.Schema(
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
      maxlength: 1200,
    },
    targetRoles: {
      type: [String],
      enum: Object.values(ROLES),
      required: true,
      validate: [
        (roles) => Array.isArray(roles) && roles.length > 0,
        "Select at least one target role.",
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    acknowledgedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  { timestamps: true }
);

notificationSchema.index({ targetRoles: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
