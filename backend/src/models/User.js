const mongoose = require("mongoose");
const { ROLES } = require("../utils/constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.JOB_SEEKER,
      required: true,
    },
    contactNumber: {
      type: String,
      default: "",
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    employerProofDocument: {
      // Employer registration proof (PDF/PNG) for admin verification
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    educationLevel: {
      type: String,
      default: "",
      trim: true,
    },
    university: {
      type: String,
      default: "",
      trim: true,
    },
    graduationYear: {
      type: Number,
      default: null,
    },
    companyName: {
      type: String,
      default: "",
      trim: true,
    },
    employmentPosition: {
      type: String,
      default: "",
      trim: true,
    },
    companyEmployeeId: {
      type: String,
      default: "",
      trim: true,
    },
    companyWebsite: {
      type: String,
      default: "",
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    linkedinUrl: {
      type: String,
      default: "",
      trim: true,
    },
    portfolioUrl: {
      type: String,
      default: "",
      trim: true,
    },
    accountStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    approvalReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, accountStatus: 1 });

module.exports = mongoose.model("User", userSchema);
