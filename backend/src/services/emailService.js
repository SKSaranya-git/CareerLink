const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const ApiError = require("../utils/ApiError");

async function getTransporter() {
  dotenv.config({ override: true });

  const smtpService = (process.env.SMTP_SERVICE || "").trim();
  const smtpHost = (process.env.SMTP_HOST || "").trim();
  const smtpPort = (process.env.SMTP_PORT || "").trim();
  const smtpUser = (process.env.SMTP_USER || "").trim();
  const smtpPass = (process.env.SMTP_PASS || "").trim();

  const hasSMTPConfig = smtpUser && smtpPass && (smtpService || (smtpHost && smtpPort));

  if (!hasSMTPConfig) {
    throw new ApiError(
      500,
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in backend/.env."
    );
  }

  const transportOptions = {
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };

  if (smtpService) {
    transportOptions.service = smtpService;
  } else {
    transportOptions.host = smtpHost;
    transportOptions.port = Number(smtpPort);
    transportOptions.secure = process.env.SMTP_SECURE === "true";
  }

  const transporter = nodemailer.createTransport(transportOptions);

  try {
    await transporter.verify();
  } catch (error) {
    throw new ApiError(
      500,
      `SMTP authentication failed. Check SMTP_USER/SMTP_PASS (use Gmail App Password). ${error.message}`
    );
  }

  return transporter;
}

async function sendEmployerDecisionEmail({ to, name, status, reason }) {
  const subject =
    status === "approved"
      ? "Your Employer Registration is Approved"
      : "Your Employer Registration was Rejected";

  const text =
    status === "approved"
      ? `Hello ${name}, your employer registration has been approved. You can now log in to JobBoard.`
      : `Hello ${name}, your employer registration was rejected. Reason: ${reason || "Not specified"}. Please update details and register again.`;

  const smtpUser = (process.env.SMTP_USER || "").trim();
  const emailFrom = (process.env.EMAIL_FROM || smtpUser || "no-reply@jobboard.local").trim();

  const mailOptions = {
    from: emailFrom,
    to,
    subject,
    text,
  };

  const liveTransporter = await getTransporter();
  await liveTransporter.sendMail(mailOptions);
}

async function sendApplicationReceivedEmail({ to, name, jobTitle, companyName }) {
  if (!to) {
    throw new ApiError(500, "Cannot send email: missing recipient address.");
  }

  const subject = "Your application has been received";
  const text = `Hello ${name},

We have received your application for "${jobTitle}" at ${companyName}.

Our team will review your application and update you as soon as there is a decision.

Thanks,
JobBoard`;

  const smtpUser = (process.env.SMTP_USER || "").trim();
  const emailFrom = (process.env.EMAIL_FROM || smtpUser || "no-reply@jobboard.local").trim();

  const mailOptions = {
    from: emailFrom,
    to,
    subject,
    text,
  };

  const liveTransporter = await getTransporter();
  await liveTransporter.sendMail(mailOptions);
}

async function sendApplicationStatusUpdatedEmail({ to, name, status, jobTitle }) {
  if (!to) {
    throw new ApiError(500, "Cannot send email: missing recipient address.");
  }

  const subjectMap = {
    shortlisted: "Congratulations, you have been shortlisted",
    rejected: "Update on your job application",
    hired: "Congratulations, you have been hired",
  };

  const bodyMap = {
    shortlisted: `Hello ${name},

Congratulations! You have been shortlisted for "${jobTitle}".

We will contact you soon with next steps.

Thanks,
JobBoard`,
    rejected: `Hello ${name},

We regret to inform you that your application for "${jobTitle}" was not selected at this time.

Thank you for your interest and we encourage you to apply again in the future.

Regards,
JobBoard`,
    hired: `Hello ${name},

Congratulations! You have been selected for "${jobTitle}".

We will reach out shortly with details about the next steps.

Thanks,
JobBoard`,
  };

  const subject = subjectMap[status] || "Update on your job application";
  const text = bodyMap[status] || `Hello ${name}, your application status was updated to: ${status}.`;

  const smtpUser = (process.env.SMTP_USER || "").trim();
  const emailFrom = (process.env.EMAIL_FROM || smtpUser || "no-reply@jobboard.local").trim();

  const mailOptions = {
    from: emailFrom,
    to,
    subject,
    text,
  };

  const liveTransporter = await getTransporter();
  await liveTransporter.sendMail(mailOptions);
}

async function sendApplicantApplicationCopyEmail({
  to,
  name,
  jobTitle,
  companyName,
  phone,
  coverLetter,
  resumeUrl,
  appliedAt,
}) {
  if (!to) {
    throw new ApiError(500, "Cannot send email: missing recipient address.");
  }

  const subject = `Copy of your application: ${jobTitle}`;
  const text = `Hello ${name},

You requested a copy of your job application submission.

Job: ${jobTitle}
Company: ${companyName}
Applied at: ${appliedAt ? new Date(appliedAt).toLocaleString() : "N/A"}

Submitted details:
- Name: ${name}
- Email: ${to}
- Phone: ${phone || "-"}
- Resume: ${resumeUrl || "-"}

Cover letter:
${coverLetter || "-"}

Thanks,
JobBoard`;

  const smtpUser = (process.env.SMTP_USER || "").trim();
  const emailFrom = (process.env.EMAIL_FROM || smtpUser || "no-reply@jobboard.local").trim();

  const liveTransporter = await getTransporter();
  await liveTransporter.sendMail({
    from: emailFrom,
    to,
    subject,
    text,
  });
}

async function sendEmployerNewApplicationEmail({
  to,
  employerName,
  jobTitle,
  companyName,
  applicantName,
  applicantEmail,
  applicantPhone,
  coverLetter,
  resumeUrl,
  appliedAt,
}) {
  if (!to) {
    throw new ApiError(500, "Cannot send email: missing recipient address.");
  }

  const subject = `New application received: ${jobTitle}`;
  const text = `Hello ${employerName || "Employer"},

You received a new application for "${jobTitle}" at ${companyName}.

Applicant details:
- Name: ${applicantName || "-"}
- Email: ${applicantEmail || "-"}
- Phone: ${applicantPhone || "-"}
- Resume: ${resumeUrl || "-"}
- Applied at: ${appliedAt ? new Date(appliedAt).toLocaleString() : "N/A"}

Cover letter:
${coverLetter || "-"}

Please sign in to your dashboard to review and shortlist/reject the applicant.

Thanks,
JobBoard`;

  const smtpUser = (process.env.SMTP_USER || "").trim();
  const emailFrom = (process.env.EMAIL_FROM || smtpUser || "no-reply@jobboard.local").trim();

  const liveTransporter = await getTransporter();
  await liveTransporter.sendMail({
    from: emailFrom,
    to,
    subject,
    text,
  });
}

function safeFormatInTimeZone(date, timeZone) {
  try {
    return new Date(date).toLocaleString(undefined, { timeZone });
  } catch {
    return new Date(date).toLocaleString();
  }
}

async function sendInterviewScheduledEmail({
  to,
  applicantName,
  jobTitle,
  companyName,
  startsAt,
  endsAt,
  timezone,
  meetingLink,
  location,
  notes,
  isUpdate,
  ics,
}) {
  if (!to) {
    throw new ApiError(500, "Cannot send email: missing recipient address.");
  }

  const subject = isUpdate
    ? `Interview rescheduled: ${jobTitle}`
    : `Interview scheduled: ${jobTitle}`;

  const whenStart = safeFormatInTimeZone(startsAt, timezone);
  const whenEnd = safeFormatInTimeZone(endsAt, timezone);

  const text = `Hello ${applicantName || "Applicant"},

${isUpdate ? "Your interview has been updated." : "Your interview has been scheduled."}

Company: ${companyName || "Employer"}
Role: ${jobTitle || "the role"}
When: ${whenStart} - ${whenEnd} (${timezone || "UTC"})

${location ? `Location: ${location}\n` : ""}${meetingLink ? `Meeting link: ${meetingLink}\n` : ""}${notes ? `Notes: ${notes}\n` : ""}
Thanks,
JobBoard`;

  const smtpUser = (process.env.SMTP_USER || "").trim();
  const emailFrom = (process.env.EMAIL_FROM || smtpUser || "no-reply@jobboard.local").trim();

  const liveTransporter = await getTransporter();
  await liveTransporter.sendMail({
    from: emailFrom,
    to,
    subject,
    text,
    ...(ics
      ? {
          alternatives: [
            {
              contentType: "text/calendar; charset=utf-8; method=REQUEST",
              content: ics,
            },
          ],
          attachments: [{ filename: "interview.ics", content: ics, contentType: "text/calendar; charset=utf-8; method=REQUEST" }],
        }
      : {}),
  });
}

async function sendInterviewCancelledEmail({
  to,
  applicantName,
  jobTitle,
  companyName,
  startsAt,
  endsAt,
  timezone,
  ics,
}) {
  if (!to) {
    throw new ApiError(500, "Cannot send email: missing recipient address.");
  }

  const subject = `Interview cancelled: ${jobTitle || "Interview"}`;
  const whenStart = safeFormatInTimeZone(startsAt, timezone);
  const whenEnd = safeFormatInTimeZone(endsAt, timezone);

  const text = `Hello ${applicantName || "Applicant"},

Your interview has been cancelled.

Company: ${companyName || "Employer"}
Role: ${jobTitle || "the role"}
When: ${whenStart} - ${whenEnd} (${timezone || "UTC"})

Thanks,
JobBoard`;

  const smtpUser = (process.env.SMTP_USER || "").trim();
  const emailFrom = (process.env.EMAIL_FROM || smtpUser || "no-reply@jobboard.local").trim();

  const liveTransporter = await getTransporter();
  await liveTransporter.sendMail({
    from: emailFrom,
    to,
    subject,
    text,
    ...(ics
      ? {
          alternatives: [
            {
              contentType: "text/calendar; charset=utf-8; method=CANCEL",
              content: ics,
            },
          ],
          attachments: [{ filename: "interview-cancelled.ics", content: ics, contentType: "text/calendar; charset=utf-8; method=CANCEL" }],
        }
      : {}),
  });
}

module.exports = {
  sendEmployerDecisionEmail,
  sendApplicationReceivedEmail,
  sendApplicationStatusUpdatedEmail,
  sendApplicantApplicationCopyEmail,
  sendEmployerNewApplicationEmail,
  sendInterviewScheduledEmail,
  sendInterviewCancelledEmail,
};
