const mongoose = require("mongoose");

// Job posting schema — stores all details for a single job listing.
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
      default: "",
      trim: true,
    },
    requirements: {
      type: String,
      default: "",
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
    // Reference to the employer (User) who posted this job
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Text index for full-text search across job listings
jobSchema.index({ title: "text", description: "text", location: "text" });
// Compound index for efficient employer-specific queries
jobSchema.index({ employer: 1, createdAt: -1 });

module.exports = mongoose.model("Job", jobSchema);
