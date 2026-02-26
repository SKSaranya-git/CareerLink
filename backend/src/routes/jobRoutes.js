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
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         title: { type: string }
 *         description: { type: string }
 *         responsibilities: { type: string }
 *         requirements: { type: string }
 *         location: { type: string }
 *         salary: { type: number }
 *         employmentType:
 *           type: array
 *           items: { type: string, enum: [full-time, part-time, internship, contract] }
 *         employer:
 *           type: object
 *           properties:
 *             _id: { type: string }
 *             name: { type: string }
 *             email: { type: string }
 *             companyName: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: View all jobs (public, paginated with search)
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Results per page (max 100)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search across title, description, location
 *     responses:
 *       200:
 *         description: Paginated list of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer }
 *                 totalCount: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 *                 jobs: { type: array, items: { $ref: '#/components/schemas/Job' } }
 */
router.get("/", jobController.getAllJobs);

/**
 * @swagger
 * /api/jobs/my-jobs:
 *   get:
 *     summary: Get jobs posted by the current employer
 *     security: [{ bearerAuth: [] }]
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: List of employer's own jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer }
 *                 jobs: { type: array, items: { $ref: '#/components/schemas/Job' } }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden – employer role required }
 */
router.get("/my-jobs", [protect, authorize(ROLES.EMPLOYER)], jobController.getMyJobs);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a single job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the job
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job: { $ref: '#/components/schemas/Job' }
 *       400: { description: Invalid ID format }
 *       404: { description: Job not found }
 */
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
    body("responsibilities").isLength({ min: 10 }).withMessage("Responsibilities must be at least 10 characters"),
    body("requirements").isLength({ min: 10 }).withMessage("Requirements must be at least 10 characters"),
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

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update an existing job (employer only, must be job owner)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the job to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, minLength: 3 }
 *               description: { type: string, minLength: 10 }
 *               responsibilities: { type: string, minLength: 10 }
 *               requirements: { type: string, minLength: 10 }
 *               location: { type: string }
 *               salary: { type: number, minimum: 0 }
 *               employmentType:
 *                 type: array
 *                 items: { type: string, enum: [full-time, part-time, internship, contract] }
 *     responses:
 *       200: { description: Job updated successfully }
 *       400: { description: Validation failed }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden – not the job owner }
 *       404: { description: Job not found }
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

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job posting (employer only, must be job owner)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the job to delete
 *     responses:
 *       200: { description: Job deleted successfully }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden – not the job owner }
 *       404: { description: Job not found }
 */
router.delete(
  "/:id",
  [protect, authorize(ROLES.EMPLOYER), param("id").isMongoId(), validateRequest],
  jobController.deleteJob
);

/**
 * @swagger
 * /api/jobs/{id}/apply:
 *   post:
 *     summary: Apply for a job (job seeker only)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the job to apply for
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [fullName, email, phone, resume]
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               coverLetter: { type: string }
 *               sendCopyToEmail: { type: boolean }
 *               resume: { type: string, format: binary, description: PDF/DOC/DOCX file }
 *     responses:
 *       201: { description: Application submitted successfully }
 *       400: { description: Validation failed or missing resume }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden – job seeker role required }
 *       404: { description: Job not found }
 *       409: { description: Already applied for this job }
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

/**
 * @swagger
 * /api/jobs/{id}/applications:
 *   get:
 *     summary: Get all applications for a specific job (employer only)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the job
 *     responses:
 *       200:
 *         description: List of applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer }
 *                 applications: { type: array }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden – employer role required }
 *       404: { description: Job not found }
 */
router.get(
  "/:id/applications",
  [protect, authorize(ROLES.EMPLOYER), param("id").isMongoId(), validateRequest],
  applicationController.getApplicationsForJob
);

module.exports = router;
