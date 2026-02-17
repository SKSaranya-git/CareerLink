const ApiError = require("../utils/ApiError");

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden. You do not have permission."));
    }
    next();
  };
}

module.exports = { authorize };
