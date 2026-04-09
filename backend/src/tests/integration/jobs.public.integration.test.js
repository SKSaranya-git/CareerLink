/**
 * Integration: hits MongoDB via Mongoose.
 * Opt-in so a missing or unreachable DB does not fail CI / local runs:
 *   set RUN_INTEGRATION=1  (PowerShell: $env:RUN_INTEGRATION="1")
 * Requires MONGO_URI in .env (loaded via jest.setup.js).
 */
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../app");

const shouldRun = process.env.RUN_INTEGRATION === "1" && Boolean(process.env.MONGO_URI);

const describeIntegration = shouldRun ? describe : describe.skip;

describeIntegration("GET /api/jobs (integration)", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test("returns 200 and a jobs array", async () => {
    const res = await request(app).get("/api/jobs");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(typeof res.body.total).toBe("number");
    expect(typeof res.body.page).toBe("number");
    expect(typeof res.body.totalPages).toBe("number");
  });

  test("supports pagination query params", async () => {
    const res = await request(app).get("/api/jobs").query({ page: 1, limit: 2 });
    expect(res.statusCode).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.jobs.length).toBeLessThanOrEqual(2);
  });
});
