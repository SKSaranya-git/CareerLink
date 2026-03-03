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

/** @swagger
 * /api/jobs:
 *   get:
 *     summary: View all jobs (public, paginated)
 *     tags: [Jobs]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
 *       - { in: query, name: search, schema: { type: string } }
 */
router.get("/", jobController.getAllJobs);

/** @swagger
 * /api/jobs/my-jobs:
 *   get:
 *     summary: Get current employer's jobs
 *     security: [{ bearerAuth: [] }]
 *     tags: [Jobs]
 */
router.get("/my-jobs", [protect, authorize(ROLES.EMPLOYER)], jobController.getMyJobs);

/** @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a single job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
router.get("/:id", [param("id").isMongoId(), validateRequest], jobController.getJobById);

/** @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job (employer only)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Jobs]
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

/** @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update a job (employer only, must own the job)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Jobs]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
router.put(
  "/:id",
  [
    protect,
    authorize(ROLES.EMPLOYER),
    param("id").isMongoId(),
    body("title").optional().isLength({ min: 3 }),
    body("description").optional().isLength({ min: 10 }),
    body("responsibilities").optional().isLength({ min: 10 }).withMessage("Responsibilities must be at least 10 characters"),
    body("requirements").optional().isLength({ min: 10 }).withMessage("Requirements must be at least 10 characters"),
    body("location").optional().notEmpty(),
    body("salary").optional().isFloat({ min: 0 }),
    body("employmentType").optional().isArray({ min: 1 }),
    body("employmentType.*").optional()
      .isIn(["full-time", "part-time", "internship", "contract"]),
    validateRequest,
  ],
  jobController.updateJob
);

/** @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job (employer only, must own the job)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Jobs]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
router.delete(
  "/:id",
  [protect, authorize(ROLES.EMPLOYER), param("id").isMongoId(), validateRequest],
  jobController.deleteJob
);

/** @swagger
 * /api/jobs/{id}/apply:
 *   post:
 *     summary: Apply for a job (job seeker only, multipart form)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Jobs]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
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

/** @swagger
 * /api/jobs/{id}/applications:
 *   get:
 *     summary: Get applications for a job (employer only)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Jobs]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
router.get(
  "/:id/applications",
  [protect, authorize(ROLES.EMPLOYER), param("id").isMongoId(), validateRequest],
  applicationController.getApplicationsForJob
);

module.exports = router;