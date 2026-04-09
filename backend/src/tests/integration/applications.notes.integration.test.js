/**
 * Application management + application notes (integration).
 * Opt-in: RUN_INTEGRATION=1 and MONGO_URI (see jobs.public.integration.test.js).
 */
const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const app = require("../../app");
const User = require("../../models/User");
const Job = require("../../models/Job");
const Application = require("../../modules/application/application.model");
const ApplicationNote = require("../../modules/applicationNote/applicationNote.model");
const generateToken = require("../../utils/generateToken");
const { ROLES } = require("../../utils/constants");

const shouldRun = process.env.RUN_INTEGRATION === "1" && Boolean(process.env.MONGO_URI);
const describeIntegration = shouldRun ? describe : describe.skip;

describeIntegration("Applications & application notes (integration)", () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  let employer;
  let seeker;
  let job;
  let application;
  let employerToken;
  let seekerToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await ApplicationNote.deleteMany({});
    await Application.deleteMany({});
    await Job.deleteMany({ title: /^integration-app-test/ });
    await User.deleteMany({ email: new RegExp(`^integration-app-${suffix}`) });

    const passwordHash = await bcrypt.hash("password123", 10);
    employer = await User.create({
      name: "Integration Employer",
      email: `integration-app-${suffix}-emp@test.local`,
      password: passwordHash,
      role: ROLES.EMPLOYER,
      companyName: "Test Co",
    });
    seeker = await User.create({
      name: "Integration Seeker",
      email: `integration-app-${suffix}-seeker@test.local`,
      password: passwordHash,
      role: ROLES.JOB_SEEKER,
    });

    job = await Job.create({
      title: `integration-app-test ${suffix}`,
      description: "Integration test job description for application flow.",
      location: "Remote",
      salary: 50000,
      employmentType: ["full-time"],
      employer: employer._id,
    });

    application = await Application.create({
      job: job._id,
      applicant: seeker._id,
      fullName: seeker.name,
      email: seeker.email,
      phone: "0770000000",
      coverLetter: "Integration test cover letter.",
      resume: "/uploads/resumes/integration-test.pdf",
      status: "pending",
    });

    employerToken = generateToken({ id: employer._id, role: employer.role });
    seekerToken = generateToken({ id: seeker._id, role: seeker.role });
  });

  afterEach(async () => {
    await ApplicationNote.deleteMany({});
    await Application.deleteMany({});
    await Job.deleteMany({ _id: job?._id });
    await User.deleteMany({ _id: { $in: [employer?._id, seeker?._id].filter(Boolean) } });
  });

  test("DELETE /api/applications/:id — seeker withdraws pending application (204)", async () => {
    const res = await request(app)
      .delete(`/api/applications/${application._id}`)
      .set("Authorization", `Bearer ${seekerToken}`);

    expect(res.statusCode).toBe(204);

    const gone = await Application.findById(application._id);
    expect(gone).toBeNull();
  });

  test("DELETE /api/applications/:id — 400 when not pending", async () => {
    application.status = "shortlisted";
    await application.save();

    const res = await request(app)
      .delete(`/api/applications/${application._id}`)
      .set("Authorization", `Bearer ${seekerToken}`);

    expect(res.statusCode).toBe(400);
  });

  test("DELETE /api/applications/:id — 403 for employer token", async () => {
    const res = await request(app)
      .delete(`/api/applications/${application._id}`)
      .set("Authorization", `Bearer ${employerToken}`);

    expect(res.statusCode).toBe(403);
  });

  test("application notes CRUD for job owner", async () => {
    const createRes = await request(app)
      .post(`/api/applications/${application._id}/notes`)
      .set("Authorization", `Bearer ${employerToken}`)
      .send({ text: "Strong candidate.", rating: 4, tags: ["phone-screen"] });

    expect(createRes.statusCode).toBe(201);
    const noteId = createRes.body.note._id;

    const listRes = await request(app)
      .get(`/api/applications/${application._id}/notes`)
      .set("Authorization", `Bearer ${employerToken}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.count).toBe(1);

    const patchRes = await request(app)
      .patch(`/api/application-notes/${noteId}`)
      .set("Authorization", `Bearer ${employerToken}`)
      .send({ text: "Strong candidate — follow up." });

    expect(patchRes.statusCode).toBe(200);

    const delRes = await request(app)
      .delete(`/api/application-notes/${noteId}`)
      .set("Authorization", `Bearer ${employerToken}`);

    expect(delRes.statusCode).toBe(200);

    const listAfter = await request(app)
      .get(`/api/applications/${application._id}/notes`)
      .set("Authorization", `Bearer ${employerToken}`);

    expect(listAfter.body.count).toBe(0);
  });

  test("withdraw removes related application notes", async () => {
    await request(app)
      .post(`/api/applications/${application._id}/notes`)
      .set("Authorization", `Bearer ${employerToken}`)
      .send({ text: "Note before withdraw." });

    const res = await request(app)
      .delete(`/api/applications/${application._id}`)
      .set("Authorization", `Bearer ${seekerToken}`);

    expect(res.statusCode).toBe(204);

    const notes = await ApplicationNote.find({ application: application._id });
    expect(notes.length).toBe(0);
  });
});
