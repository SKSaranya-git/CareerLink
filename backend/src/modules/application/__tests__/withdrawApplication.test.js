jest.mock("../application.repository");
jest.mock("../../applicationNote/applicationNote.repository");

const applicationRepository = require("../application.repository");
const applicationNoteRepository = require("../../applicationNote/applicationNote.repository");
const applicationService = require("../application.service");

describe("withdrawMyApplication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects non–job-seeker", async () => {
    await expect(
      applicationService.withdrawMyApplication({
        applicantUser: { _id: "507f1f77bcf86cd799439012", role: "employer" },
        applicationId: "507f1f77bcf86cd799439011",
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test("404 when application missing", async () => {
    applicationRepository.findById.mockResolvedValue(null);
    await expect(
      applicationService.withdrawMyApplication({
        applicantUser: { _id: "507f1f77bcf86cd799439012", role: "job_seeker" },
        applicationId: "507f1f77bcf86cd799439011",
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("403 when applicant does not own application", async () => {
    applicationRepository.findById.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      applicant: "507f1f77bcf86cd799439099",
      status: "pending",
    });
    await expect(
      applicationService.withdrawMyApplication({
        applicantUser: { _id: "507f1f77bcf86cd799439012", role: "job_seeker" },
        applicationId: "507f1f77bcf86cd799439011",
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test("400 when status is not pending", async () => {
    applicationRepository.findById.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      applicant: "507f1f77bcf86cd799439012",
      status: "shortlisted",
    });
    await expect(
      applicationService.withdrawMyApplication({
        applicantUser: { _id: "507f1f77bcf86cd799439012", role: "job_seeker" },
        applicationId: "507f1f77bcf86cd799439011",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("deletes notes then application when pending and owner", async () => {
    applicationRepository.findById.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      applicant: "507f1f77bcf86cd799439012",
      status: "pending",
    });
    applicationNoteRepository.deleteManyByApplication.mockResolvedValue({ deletedCount: 0 });
    applicationRepository.deleteById.mockResolvedValue({});

    await applicationService.withdrawMyApplication({
      applicantUser: { _id: "507f1f77bcf86cd799439012", role: "job_seeker" },
      applicationId: "507f1f77bcf86cd799439011",
    });

    expect(applicationNoteRepository.deleteManyByApplication).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(applicationRepository.deleteById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
  });
});
