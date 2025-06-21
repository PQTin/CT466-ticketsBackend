const errorHandler = (res, error, statusCode = 500) => {
  console.error("[Error]", error);

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Đã có lỗi xảy ra!",
    code: statusCode,
  });
};

module.exports = errorHandler;
