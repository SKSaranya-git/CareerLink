function errorMiddleware(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  // Multer errors should be reported as a client error (400).
  // - LIMIT_FILE_SIZE, etc. are codes from MulterError
  // - custom fileFilter errors are plain Error instances
  if (error?.name === "MulterError") {
    statusCode = 400;
    if (error.code === "LIMIT_FILE_SIZE") {
      message = "Uploaded file is too large.";
    }
  }
  // Custom multer fileFilter errors typically contain friendly messages already.
  if (statusCode === 500 && message && /only .* files are allowed/i.test(message)) {
    statusCode = 400;
  }
  // Mongo duplicate key (e.g., apply only once per job).
  if (error?.code === 11000) {
    statusCode = 409;
    message = "Duplicate resource.";
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  });
}

module.exports = errorMiddleware;
