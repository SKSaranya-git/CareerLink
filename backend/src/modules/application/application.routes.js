const express = require("express");
const { body, param } = require("express-validator");

const applicationController = require("./application.controller");
const { protect } = require("../../middlewares/authMiddleware");
const { authorize } = require("../../middlewares/roleMiddleware");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../utils/constants");
const { uploadResume } = require("../../config/multer");

const router = express.Router();

// Job Seeker
router.post(
  "/:jobId",
  [
    protect,
    authorize(ROLES.JOB_SEEKER),
    uploadResume.single("resume"),
    param("jobId").isMongoId(),
    body("fullName").notEmpty().withMessage("fullName is required."),
    body("email").isEmail().withMessage("Valid email is required.").normalizeEmail(),
    body("phone").notEmpty().withMessage("phone is required."),
    body("coverLetter").optional().isString(),
    body("sendCopyToEmail").optional().isBoolean().toBoolean(),
    validateRequest,
  ],
  applicationController.submitApplication
);

router.get(
  "/my-applications",
  [protect, authorize(ROLES.JOB_SEEKER)],
  applicationController.getMyApplications
);

// Employer
router.get(
  "/job/:jobId",
  [protect, authorize(ROLES.EMPLOYER), param("jobId").isMongoId(), validateRequest],
  applicationController.getApplicationsForJob
);

router.get(
  "/shortlisted",
  [protect, authorize(ROLES.EMPLOYER)],
  applicationController.employerGetShortlisted
);

router.patch(
  "/:applicationId/status",
  [
    protect,
    authorize(ROLES.EMPLOYER),
    param("applicationId").isMongoId(),
    body("status")
      .isIn(["shortlisted", "rejected", "hired"])
      .withMessage("status must be shortlisted, rejected, or hired."),
    validateRequest,
  ],
  applicationController.updateStatus
);

// Admin
router.get("/", [protect, authorize(ROLES.ADMIN)], applicationController.adminGetAll);

module.exports = router;

