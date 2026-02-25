const express = require("express");
const { body, param } = require("express-validator");
const userController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { ROLES } = require("../utils/constants");
const { uploadProfileImage } = require("../config/multer");

const router = express.Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     security: [{ bearerAuth: [] }]
 *     tags: [Users]
 *     responses:
 *       200: { description: OK }
 */
router.get("/profile", protect, userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     security: [{ bearerAuth: [] }]
 *     tags: [Users]
 *     responses:
 *       200: { description: OK }
 */
router.put(
  "/profile",
  [
    protect,
    body("name").optional(),
    body("contactNumber").optional(),
    body("bio").optional(),
    body("location").optional(),
    body("educationLevel").optional(),
    body("university").optional(),
    body("graduationYear").optional(),
    body("companyName").optional(),
    body("employmentPosition").optional(),
    body("companyEmployeeId").optional(),
    body("companyWebsite").optional(),
    body("skills").optional(),
    body("linkedinUrl").optional(),
    body("portfolioUrl").optional(),
    validateRequest,
  ],
  userController.updateProfile
);

router.post(
  "/profile-image",
  protect,
  uploadProfileImage.single("profileImage"),
  userController.uploadProfileImage
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Users]
 *     responses:
 *       200: { description: OK }
 */
router.get("/", protect, authorize(ROLES.ADMIN), userController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Users]
 *     responses:
 *       200: { description: OK }
 */
router.delete(
  "/:id",
  [protect, authorize(ROLES.ADMIN), param("id").isMongoId(), validateRequest],
  userController.deleteUser
);

// Saved Jobs (job_seeker only)
router.get(
  "/saved-jobs",
  [protect, authorize(ROLES.JOB_SEEKER)],
  userController.getSavedJobs
);

router.post(
  "/saved-jobs/:jobId",
  [protect, authorize(ROLES.JOB_SEEKER), param("jobId").isMongoId(), validateRequest],
  userController.saveJob
);

router.delete(
  "/saved-jobs/:jobId",
  [protect, authorize(ROLES.JOB_SEEKER), param("jobId").isMongoId(), validateRequest],
  userController.unsaveJob
);

module.exports = router;
