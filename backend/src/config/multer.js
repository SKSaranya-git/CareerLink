const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.join(__dirname, "../../uploads/profiles");
fs.mkdirSync(uploadDir, { recursive: true });

const employerProofDir = path.join(__dirname, "../../uploads/employer-proofs");
fs.mkdirSync(employerProofDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }
  cb(new Error("Only image files are allowed."));
};

const uploadProfileImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

const employerProofStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, employerProofDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `proof-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const employerProofFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/png"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error("Only PDF or PNG files are allowed."));
};

const uploadEmployerProof = multer({
  storage: employerProofStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: employerProofFilter,
});

module.exports = { uploadProfileImage, uploadEmployerProof };
