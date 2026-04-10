const express = require("express");
const { body, param } = require("express-validator");

const { protect } = require("../../middlewares/authMiddleware");
const { authorize } = require("../../middlewares/roleMiddleware");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../utils/constants");
const applicationNoteController = require("./applicationNote.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: ApplicationNotes
 *     description: Employer evaluation notes on applications
 */

/**
 * @swagger
 * /api/applications/{applicationId}/notes:
 *   post:
 *     summary: Add internal note on an application (employer)
 *     tags: [ApplicationNotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               tags: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Created }
 *   get:
 *     summary: List notes for an application (employer)
 *     tags: [ApplicationNotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
// Nested under applications for create/list.
router.post(
  "/applications/:applicationId/notes",
  [
    protect,
    authorize(ROLES.EMPLOYER),
    param("applicationId").isMongoId(),
    body("text").notEmpty().withMessage("text is required."),
    body("rating").optional({ nullable: true }).isInt({ min: 1, max: 5 }),
    body("tags").optional(),
    validateRequest,
  ],
  applicationNoteController.create
);

router.get(
  "/applications/:applicationId/notes",
  [protect, authorize(ROLES.EMPLOYER), param("applicationId").isMongoId(), validateRequest],
  applicationNoteController.listByApplication
);

/**
 * @swagger
 * /api/application-notes/{noteId}:
 *   patch:
 *     summary: Update a note (employer, author)
 *     tags: [ApplicationNotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *   delete:
 *     summary: Delete a note (employer, author)
 *     tags: [ApplicationNotes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
// Standalone resource for update/delete.
router.patch(
  "/application-notes/:noteId",
  [
    protect,
    authorize(ROLES.EMPLOYER),
    param("noteId").isMongoId(),
    body("text").optional().isString(),
    body("rating").optional({ nullable: true }).isInt({ min: 1, max: 5 }),
    body("tags").optional(),
    validateRequest,
  ],
  applicationNoteController.update
);

router.delete(
  "/application-notes/:noteId",
  [protect, authorize(ROLES.EMPLOYER), param("noteId").isMongoId(), validateRequest],
  applicationNoteController.remove
);

module.exports = router;

