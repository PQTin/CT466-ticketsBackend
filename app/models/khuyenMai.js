module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "KhuyenMai",
    {
      ma: { type: DataTypes.STRING(50), unique: true, allowNull: false },
      moTa: { type: DataTypes.TEXT },
      loaiApDung: {
        type: DataTypes.ENUM("ve", "combo", "all"),
        defaultValue: "all",
      },
      phanTramGiam: { type: DataTypes.INTEGER, allowNull: false },
      ngayBatDau: { type: DataTypes.DATEONLY, allowNull: false },
      ngayKetThuc: { type: DataTypes.DATEONLY, allowNull: false },
      duongDanAnh: { type: DataTypes.STRING(255), allowNull: true },
      hoatDong: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: "khuyenMai",
      timestamps: false,
    }
  );
};
