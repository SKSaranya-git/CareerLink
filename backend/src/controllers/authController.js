const authService = require("../services/authService");

async function register(req, res, next) {
  try {
    const payload = { ...req.body };

    // Optional employer proof upload (PDF/PNG) for admin verification.
    // We keep it optional so job_seeker/admin registrations don't need it.
    if (req.file) {
      payload.employerProofDocument = `/uploads/employer-proofs/${req.file.filename}`;
    }

    const result = await authService.registerUser(payload);
    if (result.pendingApproval) {
      return res.status(202).json(result);
    }
    res.status(201).json({
      message: "User registered successfully.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({
      message: "Login successful.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
};
