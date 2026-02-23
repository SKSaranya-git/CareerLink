Swagger documentation is exposed at:

`http://localhost:5000/api/docs`

Route annotations are defined in `src/routes/*.js`.

---

## Application Management System

Base path: `/api/applications`

### Job Seeker

`POST /api/applications/:jobId` (multipart/form-data)

- Fields: `fullName`, `email`, `phone`, `coverLetter` (optional)
- File: `resume` (required; PDF/DOC/DOCX)

Sample response:

```json
{
  "message": "Application submitted successfully. Confirmation email sent.",
  "emailSent": true,
  "emailWarning": null,
  "application": {
    "_id": "65c0f...",
    "job": "65bff...",
    "applicant": "65bf0...",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "9999999999",
    "coverLetter": "I am interested...",
    "resume": "/uploads/resumes/resume-1700000000000-123456789.pdf",
    "status": "pending",
    "appliedAt": "2026-02-18T12:00:00.000Z",
    "updatedAt": "2026-02-18T12:00:00.000Z"
  }
}
```

`GET /api/applications/my-applications`

### Employer

`GET /api/applications/job/:jobId`

`PATCH /api/applications/:applicationId/status`

- Body: `{ "status": "shortlisted" | "rejected" | "hired" }`
- When status is `hired`, response includes:
  `{ "message": "Candidate marked as hired. Proceed to interview scheduling." }`

### Admin

`GET /api/applications` (view all applications)
