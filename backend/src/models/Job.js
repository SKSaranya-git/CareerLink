const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    responsibilities: {
      type: String,
      required: true,
      trim: true,
    },
    requirements: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    salary: {
      type: Number,
      required: true,
      min: 0,
    },
    employmentType: {
      type: [String],
      enum: ["full-time", "part-time", "internship", "contract"],
      required: true,
      validate: [v => Array.isArray(v) && v.length > 0, "Must specify at least one employment type"],
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", description: "text", location: "text" });
jobSchema.index({ employer: 1, createdAt: -1 });

module.exports = mongoose.model("Job", jobSchema);
