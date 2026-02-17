const express = require("express");
const { body, param } = require("express-validator");
const jobController = require("../controllers/jobController");
const applicationController = require("../controllers/applicationController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { ROLES } = require("../utils/constants");

const router = express.Router();

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: View all jobs (public)
 *     tags: [Jobs]
 *     responses:
 *       200: { description: OK }
 */
router.get("/", jobController.getAllJobs);

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
    body("location").notEmpty(),
    body("salary").isFloat({ min: 0 }),
    body("employmentType").isIn(["full-time", "part-time", "internship", "contract"]),
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
    body("location").optional().notEmpty(),
    body("salary").optional().isFloat({ min: 0 }),
    body("employmentType").optional().isIn(["full-time", "part-time", "internship", "contract"]),
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
    param("id").isMongoId(),
    body("coverLetter").optional().isString(),
    validateRequest,
  ],
  applicationController.applyForJob
);

router.get(
  "/:id/applications",
  [protect, param("id").isMongoId(), validateRequest],
  applicationController.getApplicationsForJob
);

module.exports = router;
