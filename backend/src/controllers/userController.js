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

async function getPublicEmployerProfile(req, res, next) {
  try {
    const user = await userService.getPublicEmployerProfile(req.params.userId);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

async function getPublicSeekerProfileForEmployer(req, res, next) {
  try {
    const result = await userService.getPublicSeekerProfileForEmployer(
      req.params.userId,
      req.user.id,
      req.query.applicationId || null
    );
    res.status(200).json(result);
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

module.exports = {
  getProfile,
  getPublicEmployerProfile,
  getPublicSeekerProfileForEmployer,
  updateProfile,
  getAllUsers,
  deleteUser,
  uploadProfileImage,
};
