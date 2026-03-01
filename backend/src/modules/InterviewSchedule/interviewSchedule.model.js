const mongoose = require("mongoose");

// Interview Scheduler System model.
// Stores interview slots created by an employer for a specific application.
const interviewScheduleSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
    timezone: {
      // IANA timezone name from browser, e.g. "Asia/Kolkata"
      type: String,
      trim: true,
      default: "UTC",
    },
    meetingLink: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      // Can be "Online", "Office", etc.
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["scheduled", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

interviewScheduleSchema.index({ employer: 1, startsAt: 1 });
interviewScheduleSchema.index({ applicant: 1, startsAt: 1 });
interviewScheduleSchema.index({ application: 1, startsAt: 1 });

module.exports = mongoose.model("InterviewSchedule", interviewScheduleSchema);

