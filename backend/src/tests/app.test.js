const request = require("supertest");
const app = require("../app");

describe("API smoke tests", () => {
  test("GET /health should return 200", async () => {
    const response = await request(app).get("/health");
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  test("POST /api/auth/register should fail with invalid payload", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "invalid",
      password: "123",
      role: "bad-role",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  test("POST /api/jobs should require authentication", async () => {
    const response = await request(app).post("/api/jobs").send({
      title: "Frontend Developer",
      description: "Build responsive UI for job board platform.",
      location: "Colombo",
      salary: 120000,
      employmentType: "full-time",
    });

    expect(response.statusCode).toBe(401);
  });
});
