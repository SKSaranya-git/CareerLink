const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");
const { ROLES } = require("../utils/constants");

async function registerUser(payload) {
  const { name, email, password, role } = payload;
  const normalizedEmail = email?.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });

  if (role === ROLES.ADMIN && payload.adminInviteCode !== process.env.ADMIN_INVITE_CODE) {
    throw new ApiError(403, "Invalid admin registration code.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const accountStatus = role === ROLES.EMPLOYER ? "pending" : "approved";

  if (existing && role === ROLES.EMPLOYER) {
    existing.name = name?.trim() || existing.name;
    existing.email = normalizedEmail;
    existing.password = hashedPassword;
    existing.role = ROLES.EMPLOYER;
    existing.contactNumber = payload.contactNumber || "";
    existing.bio = payload.bio || "";
    existing.location = payload.location || "";
    existing.educationLevel = payload.educationLevel || "";
    existing.university = payload.university || "";
    existing.graduationYear = payload.graduationYear || null;
    existing.skills = payload.skills || [];
    existing.linkedinUrl = payload.linkedinUrl || "";
    existing.portfolioUrl = payload.portfolioUrl || "";
    existing.companyName = payload.companyName || "";
    existing.employmentPosition = payload.employmentPosition || "";
    existing.companyEmployeeId = payload.companyEmployeeId || "";
    existing.companyWebsite = payload.companyWebsite || "";
    existing.employerProofDocument = payload.employerProofDocument || existing.employerProofDocument || "";
    existing.accountStatus = "pending";
    existing.approvalReason = "";
    await existing.save();

    return {
      user: sanitizeUser(existing),
      pendingApproval: true,
      message: "Employer registration submitted and pending admin approval.",
    };
  }

  if (existing) {
    throw new ApiError(409, "Email already registered.");
  }

  const user = await User.create({
    name: name?.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    contactNumber: payload.contactNumber || "",
    bio: payload.bio || "",
    location: payload.location || "",
    educationLevel: payload.educationLevel || "",
    university: payload.university || "",
    graduationYear: payload.graduationYear || null,
    skills: payload.skills || [],
    linkedinUrl: payload.linkedinUrl || "",
    portfolioUrl: payload.portfolioUrl || "",
    companyName: payload.companyName || "",
    employmentPosition: payload.employmentPosition || "",
    companyEmployeeId: payload.companyEmployeeId || "",
    companyWebsite: payload.companyWebsite || "",
    employerProofDocument: payload.employerProofDocument || "",
    accountStatus,
  });

  if (role === ROLES.EMPLOYER) {
    return {
      user: sanitizeUser(user),
      pendingApproval: true,
      message: "Employer registration submitted and pending admin approval.",
    };
  }

  const token = generateToken({ id: user._id, role: user.role });
  return { user: sanitizeUser(user), token };
}

async function loginUser({ email, password }) {
  const normalizedEmail = email?.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (user.role === ROLES.EMPLOYER && user.accountStatus !== "approved") {
    const reasonText =
      user.accountStatus === "rejected" && user.approvalReason
        ? ` Reason: ${user.approvalReason}`
        : "";
    throw new ApiError(
      403,
      `Employer account is ${user.accountStatus}. Please wait for admin review.${reasonText}`
    );
  }

  const token = generateToken({ id: user._id, role: user.role });
  return { user: sanitizeUser(user), token };
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    contactNumber: user.contactNumber,
    profileImage: user.profileImage,
    employerProofDocument: user.employerProofDocument,
    bio: user.bio,
    location: user.location,
    educationLevel: user.educationLevel,
    university: user.university,
    graduationYear: user.graduationYear,
    companyName: user.companyName,
    employmentPosition: user.employmentPosition,
    companyEmployeeId: user.companyEmployeeId,
    companyWebsite: user.companyWebsite,
    skills: user.skills,
    linkedinUrl: user.linkedinUrl,
    portfolioUrl: user.portfolioUrl,
    accountStatus: user.accountStatus,
    approvalReason: user.approvalReason,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports = {
  registerUser,
  loginUser,
};
