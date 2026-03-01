const interviewScheduleService = require("./interviewSchedule.service");

async function create(req, res, next) {
  try {
    const result = await interviewScheduleService.createInterviewSchedule({
      employerUser: req.user,
      payload: req.body,
    });
    res.status(201).json({
      message: "Interview scheduled.",
      emailSent: result.emailSent,
      emailWarning: result.emailWarning,
      interview: result.interview,
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const interviews = await interviewScheduleService.listInterviewSchedules({
      user: req.user,
      query: req.query || {},
    });
    res.status(200).json({ count: interviews.length, interviews });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const interview = await interviewScheduleService.getInterviewScheduleById({
      user: req.user,
      interviewId: req.params.interviewId,
    });
    res.status(200).json({ interview });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const result = await interviewScheduleService.updateInterviewSchedule({
      employerUser: req.user,
      interviewId: req.params.interviewId,
      payload: req.body,
    });
    res.status(200).json({
      message: "Interview schedule updated.",
      emailSent: result.emailSent,
      emailWarning: result.emailWarning,
      interview: result.interview,
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await interviewScheduleService.deleteInterviewSchedule({
      employerUser: req.user,
      interviewId: req.params.interviewId,
    });
    res.status(200).json({
      message: "Interview schedule deleted.",
      emailSent: result.emailSent,
      emailWarning: result.emailWarning,
    });
  } catch (err) {
    next(err);
  }
}

async function ics(req, res, next) {
  try {
    const content = await interviewScheduleService.getInterviewIcs({
      user: req.user,
      interviewId: req.params.interviewId,
    });

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="interview-${req.params.interviewId}.ics"`);
    res.status(200).send(content);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, update, remove, ics };

