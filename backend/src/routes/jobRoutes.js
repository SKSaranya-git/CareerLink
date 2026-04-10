const express = require("express");
const { body, param } = require("express-validator");
const jobController = require("../controllers/jobController");
const applicationController = require("../controllers/applicationController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { ROLES } = require("../utils/constants");
const { uploadResume } = require("../config/multer");

const router = express.Router();

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: List jobs (public) with search, filters, and pagination
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search (title, description, location, etc.)
 *       - in: query
 *         name: minSalary
 *         schema: { type: number }
 *       - in: query
 *         name: employmentType
 *         schema: { type: string, enum: [full-time, part-time, internship, contract] }
 *       - in: query
 *         name: datePosted
 *         schema: { type: string, enum: [24h, 7d, 30d] }
 *     responses:
 *       200:
 *         description: Paginated job list
 */
router.get("/", jobController.getAllJobs);

// Employer: view only jobs posted by current employer
router.get("/my-jobs", [protect, authorize(ROLES.EMPLOYER)], jobController.getMyJobs);

router.get("/:id", [param("id").isMongoId(), validateRequest], jobController.getJobById);

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Post a new job (employer only)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Jobs]
 *     responses:
 *       201: { description: Created }
 */
router.post(
  "/",
  [
    protect,
    authorize(ROLES.EMPLOYER),
    body("title").isLength({ min: 3 }),
    body("description").isLength({ min: 10 }),
    body("responsibilities")
      .optional({ checkFalsy: true })
      .isLength({ min: 10 })
      .withMessage("Responsibilities must be at least 10 characters"),
    body("requirements")
      .optional({ checkFalsy: true })
      .isLength({ min: 10 })
      .withMessage("Requirements must be at least 10 characters"),
    body("location").notEmpty(),
    body("salary").isFloat({ min: 0 }),
    body("employmentType")
      .isArray({ min: 1 })
      .withMessage("Must provide at least one employment type"),
    body("employmentType.*")
      .isIn(["full-time", "part-time", "internship", "contract"])
      .withMessage("Invalid employment type"),
    validateRequest,
  ],
  jobController.createJob
);

router.put(
  "/:id",
  [
    protect,
    authorize(ROLES.EMPLOYER),
    param("id").isMongoId(),
    body("title").optional().isLength({ min: 3 }),
    body("description").optional().isLength({ min: 10 }),
    body("responsibilities")
      .optional({ checkFalsy: true })
      .isLength({ min: 10 })
      .withMessage("Responsibilities must be at least 10 characters"),
    body("requirements")
      .optional({ checkFalsy: true })
      .isLength({ min: 10 })
      .withMessage("Requirements must be at least 10 characters"),
    body("location").optional().notEmpty(),
    body("salary").optional().isFloat({ min: 0 }),
    body("employmentType").optional().isArray({ min: 1 }),
    body("employmentType.*")
      .optional()
      .isIn(["full-time", "part-time", "internship", "contract"]),
    validateRequest,
  ],
  jobController.updateJob
);

router.delete(
  "/:id",
  [protect, authorize(ROLES.EMPLOYER), param("id").isMongoId(), validateRequest],
  jobController.deleteJob
);

router.post(
  "/:id/apply",
  [
    protect,
    authorize(ROLES.JOB_SEEKER),
    uploadResume.single("resume"),
    param("id").isMongoId(),
    body("fullName").notEmpty().withMessage("fullName is required."),
    body("email").isEmail().withMessage("Valid email is required.").normalizeEmail(),
    body("phone").notEmpty().withMessage("phone is required."),
    body("coverLetter").optional().isString(),
    body("sendCopyToEmail").optional().isBoolean().toBoolean(),
    validateRequest,
  ],
  applicationController.applyForJob
);

router.get(
  "/:id/applications",
  [protect, authorize(ROLES.EMPLOYER), param("id").isMongoId(), validateRequest],
  applicationController.getApplicationsForJob
);

module.exports = router;
