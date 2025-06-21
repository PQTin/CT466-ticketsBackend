const jwt = require("jsonwebtoken");
const db = require("../models");
const errorHandler = require("../utils/errorHandler");

const User = db.NguoiDung;

// Middleware xác thực token
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorHandler(
        res,
        new Error("Không có token, truy cập bị từ chối"),
        401
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // chứa id và vaiTro
    next();
  } catch (error) {
    return errorHandler(
      res,
      new Error("Token không hợp lệ hoặc đã hết hạn"),
      401
    );
  }
};

// Middleware kiểm tra quyền admin
exports.isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.user_id); // `user_id` do bạn gán khi tạo token
    if (!user || user.vaiTro !== "admin") {
      return errorHandler(res, new Error("Bạn không có quyền truy cập"), 403);
    }

    next();
  } catch (error) {
    return errorHandler(res, error, 500);
  }
};
