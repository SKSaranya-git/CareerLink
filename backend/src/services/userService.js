const User = require("../models/User");
const ApiError = require("../utils/ApiError");

async function getProfile(userId) {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  return user;
}

async function updateProfile(userId, payload) {
  const allowedFields = [
    "name",
    "contactNumber",
    "bio",
    "location",
    "educationLevel",
    "university",
    "graduationYear",
    "skills",
    "linkedinUrl",
    "portfolioUrl",
    "companyName",
    "employmentPosition",
    "companyEmployeeId",
    "companyWebsite",
    "profileImage",
  ];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updateData[field] = payload[field];
    }
  });

  const updated = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!updated) {
    throw new ApiError(404, "User not found.");
  }

  return updated;
}

async function getAllUsers() {
  return User.find().select("-password").sort({ createdAt: -1 });
}

async function deleteUserByAdmin(userId) {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  deleteUserByAdmin,
};
