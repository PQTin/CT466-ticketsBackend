module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "NguoiDung",
    {
      tenDangNhap: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      matKhau: { type: DataTypes.STRING(255), allowNull: false },
      soDienThoai: { type: DataTypes.STRING(20), unique: true },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      duongDanAvatar: { type: DataTypes.STRING(255) },
      vaiTro: {
        type: DataTypes.ENUM("admin", "client", "staff"),
        defaultValue: "client",
      },
      trangThai: { type: DataTypes.ENUM("good", "bad"), defaultValue: "good" },
      taoLuc: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "nguoiDung",
      timestamps: false,
    }
  );
};
