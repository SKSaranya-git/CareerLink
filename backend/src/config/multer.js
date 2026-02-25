const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.join(__dirname, "../../uploads/profiles");
fs.mkdirSync(uploadDir, { recursive: true });

const employerProofDir = path.join(__dirname, "../../uploads/employer-proofs");
fs.mkdirSync(employerProofDir, { recursive: true });

const resumeDir = path.join(__dirname, "../../uploads/resumes");
fs.mkdirSync(resumeDir, { recursive: true });

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

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, resumeDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `resume-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const resumeFileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error("Only PDF, DOC, or DOCX resume files are allowed."));
};

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: resumeFileFilter,
});

module.exports = { uploadProfileImage, uploadEmployerProof, uploadResume };
