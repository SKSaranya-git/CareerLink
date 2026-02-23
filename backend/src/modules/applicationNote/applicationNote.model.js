const mongoose = require("mongoose");

// Novelty CRUD: Employer evaluation notes per application (ATS-like).
const applicationNoteSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    rating: {
      // Optional quick score for internal review.
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

applicationNoteSchema.index({ application: 1, createdAt: -1 });
// One evaluation note per employer per application (simple CRUD UX).
applicationNoteSchema.index({ application: 1, employer: 1 }, { unique: true });

module.exports = mongoose.model("ApplicationNote", applicationNoteSchema);

