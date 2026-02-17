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

module.exports = {
  sendEmployerDecisionEmail,
};
