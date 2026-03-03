const userService = require("../services/userService");

async function getProfile(req, res, next) {
  try {
    const user = await userService.getProfile(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const updated = await userService.updateProfile(req.user.id, req.body);
    res.status(200).json({
      message: "Profile updated successfully.",
      user: updated,
    });
  } catch (error) {
    next(error);
  }
}

async function getAllUsers(req, res, next) {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ count: users.length, users });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    await userService.deleteUserByAdmin(req.params.id);
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    next(error);
  }
}

async function uploadProfileImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded." });
    }

    const imagePath = `/uploads/profiles/${req.file.filename}`;
    const updated = await userService.updateProfile(req.user.id, { profileImage: imagePath });
    res.status(200).json({
      message: "Profile image uploaded successfully.",
      user: updated,
    });
  } catch (error) {
    next(error);
  }
}

async function saveJob(req, res, next) {
  try {
    const result = await userService.saveJob(req.user.id, req.params.jobId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function unsaveJob(req, res, next) {
  try {
    const result = await userService.unsaveJob(req.user.id, req.params.jobId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getSavedJobs(req, res, next) {
  try {
    const savedJobs = await userService.getSavedJobs(req.user.id);
    res.status(200).json({ count: savedJobs.length, savedJobs });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  deleteUser,
  uploadProfileImage,
  saveJob,
  unsaveJob,
  getSavedJobs,
};
