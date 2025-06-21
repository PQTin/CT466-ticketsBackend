const app = require("./app");
const db = require("./app/models");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // Kiểm tra kết nối CSDL
    await db.sequelize.authenticate();
    console.log("✅ Đã kết nối cơ sở dữ liệu thành công");

    // Đồng bộ models -> tạo bảng nếu chưa có
    await db.sequelize.sync(); // hoặc .sync({ alter: true }) khi cần cập nhật bảng

    // Khởi chạy server
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Lỗi kết nối CSDL hoặc khởi động server:", err);
    process.exit(1);
  }
})();
