const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const validateRequest = require("../middlewares/validateRequest");
const { ROLES } = require("../utils/constants");
const { uploadEmployerProof } = require("../config/multer");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [admin, employer, job_seeker] }
 *     responses:
 *       201: { description: Created }
 */
router.post(
  "/register",
  // Optional multipart upload field: employerProof (PDF/PNG)
  uploadEmployerProof.single("employerProof"),
  [
    body("name").notEmpty().withMessage("Name is required."),
    body("email").notEmpty().withMessage("Email is required."),
    body("password").notEmpty().withMessage("Password is required."),
    body("role")
      .notEmpty()
      .withMessage("Role is required.")
      .isIn(Object.values(ROLES))
      .withMessage("Role must be admin, employer, or job_seeker."),
    validateRequest,
  ],
  authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.post(
  "/login",
  [body("email").trim().isEmail().normalizeEmail(), body("password").notEmpty(), validateRequest],
  authController.login
);

module.exports = router;
