const multer = require("multer");
const path = require("path");

// Hàm tạo multer với thư mục động
const createMulter = (folder) => {
  return multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads", folder)); // Lưu vào thư mục cụ thể
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Chỉ chấp nhận file ảnh (JPG, PNG, GIF)"), false);
      }
      cb(null, true);
    },
  });
};

// Tạo middleware upload riêng cho avatar và poster
const uploadAvatar = createMulter("avatars").single("avatar");
const uploadPoster = createMulter("posters");
const uploadCombo = createMulter("combos").single("combo");
module.exports = { uploadAvatar, uploadPoster, uploadCombo };
