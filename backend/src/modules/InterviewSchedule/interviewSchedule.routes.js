const express = require("express");
const { body, param, query } = require("express-validator");

const interviewScheduleController = require("./interviewSchedule.controller");
const { protect } = require("../../middlewares/authMiddleware");
const { authorize } = require("../../middlewares/roleMiddleware");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../utils/constants");

const router = express.Router();

router.post(
  "/",
  [
    protect,
    authorize(ROLES.EMPLOYER),
    body("applicationId").isMongoId().withMessage("applicationId must be a valid id."),
    body("startsAt").isISO8601().withMessage("startsAt must be ISO8601 datetime."),
    body("endsAt").isISO8601().withMessage("endsAt must be ISO8601 datetime."),
    body("timezone").optional().isString().trim(),
    body("meetingLink").optional().isString().trim(),
    body("location").optional().isString().trim(),
    body("notes").optional().isString().trim(),
    validateRequest,
  ],
  interviewScheduleController.create
);

router.get(
  "/",
  [
    protect,
    authorize(ROLES.EMPLOYER, ROLES.JOB_SEEKER),
    query("from").optional().isISO8601().withMessage("from must be ISO8601 datetime."),
    query("to").optional().isISO8601().withMessage("to must be ISO8601 datetime."),
    query("applicationId").optional().isMongoId().withMessage("applicationId must be a valid id."),
    validateRequest,
  ],
  interviewScheduleController.list
);

router.get(
  "/:interviewId/ics",
  [
    protect,
    authorize(ROLES.EMPLOYER, ROLES.JOB_SEEKER),
    param("interviewId").isMongoId(),
    validateRequest,
  ],
  interviewScheduleController.ics
);

router.get(
  "/:interviewId",
  [
    protect,
    authorize(ROLES.EMPLOYER, ROLES.JOB_SEEKER),
    param("interviewId").isMongoId(),
    validateRequest,
  ],
  interviewScheduleController.getById
);

router.patch(
  "/:interviewId",
  [
    protect,
    authorize(ROLES.EMPLOYER),
    param("interviewId").isMongoId(),
    body("startsAt").optional().isISO8601(),
    body("endsAt").optional().isISO8601(),
    body("timezone").optional().isString().trim(),
    body("meetingLink").optional().isString().trim(),
    body("location").optional().isString().trim(),
    body("notes").optional().isString().trim(),
    body("status").optional().isIn(["scheduled", "cancelled"]),
    validateRequest,
  ],
  interviewScheduleController.update
);

router.delete(
  "/:interviewId",
  [protect, authorize(ROLES.EMPLOYER), param("interviewId").isMongoId(), validateRequest],
  interviewScheduleController.remove
);

module.exports = router;

