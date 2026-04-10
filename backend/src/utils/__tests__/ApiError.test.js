const ApiError = require("../ApiError");

describe("ApiError (unit)", () => {
  test("sets statusCode and message", () => {
    const err = new ApiError(404, "Not found");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.isOperational).toBe(true);
  });
});
