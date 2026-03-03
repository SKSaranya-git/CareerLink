const express = require("express");
const { body, param } = require("express-validator");

const { protect } = require("../../middlewares/authMiddleware");
const { authorize } = require("../../middlewares/roleMiddleware");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../utils/constants");
const applicationNoteController = require("./applicationNote.controller");

const router = express.Router();

// Nested under applications for create/list.
router.post(
  "/applications/:applicationId/notes",
  [
    protect,
    authorize(ROLES.EMPLOYER),
    param("applicationId").isMongoId(),
    body("text").notEmpty().withMessage("text is required."),
    body("rating").optional({ nullable: true }).isInt({ min: 1, max: 5 }),
    body("tags")
      .optional()
      .custom((value) => Array.isArray(value) || typeof value === "string")
      .withMessage("tags must be an array or comma-separated string."),
    validateRequest,
  ],
  applicationNoteController.create
);

router.get(
  "/applications/:applicationId/notes",
  [protect, authorize(ROLES.EMPLOYER), param("applicationId").isMongoId(), validateRequest],
  applicationNoteController.listByApplication
);

// Standalone resource for update/delete.
router.get(
  "/application-notes/:noteId",
  [protect, authorize(ROLES.EMPLOYER), param("noteId").isMongoId(), validateRequest],
  applicationNoteController.getById
);

router.patch(
  "/application-notes/:noteId",
  [
    protect,
    authorize(ROLES.EMPLOYER),
    param("noteId").isMongoId(),
    body("text").optional().isString(),
    body("rating").optional({ nullable: true }).isInt({ min: 1, max: 5 }),
    body("tags")
      .optional()
      .custom((value) => Array.isArray(value) || typeof value === "string")
      .withMessage("tags must be an array or comma-separated string."),
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

