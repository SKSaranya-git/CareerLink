const mongoose = require("mongoose");

// Application Management System model.
// Note: Field-level "required" is enforced primarily at API validation level so
// older/alternate apply flows can still work without breaking on missing fields.
const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    coverLetter: {
      type: String,
      default: "",
      trim: true,
    },
    resume: {
      // Local file path (served via /uploads) or cloud URL.
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "shortlisted", "rejected", "hired"],
      default: "pending",
    },
  },
  {
    timestamps: { createdAt: "appliedAt", updatedAt: "updatedAt" },
  }
);

// A jobSeeker can apply only ONCE per job.
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, appliedAt: -1 });
applicationSchema.index({ job: 1, appliedAt: -1 });

module.exports = mongoose.model("Application", applicationSchema);

