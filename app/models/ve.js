module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Ve",
    {
      nguoiDungId: { type: DataTypes.INTEGER, allowNull: false },
      gheId: { type: DataTypes.INTEGER, allowNull: false },
      lichChieuId: { type: DataTypes.INTEGER, allowNull: false },
      gia: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      giaGoc: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      maGiamGiaSuDung: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      trangThai: {
        type: DataTypes.ENUM(
          "pending",
          "unused",
          "used",
          "expired",
          "refunded",
          "cancelled"
        ),
        defaultValue: "pending",
      },
      daThanhToan: { type: DataTypes.BOOLEAN, defaultValue: false },
      muaLuc: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      maQR: { type: DataTypes.STRING(255) },
      tenLoaiGhe: { type: DataTypes.STRING(50), allowNull: true },
    },
    {
      tableName: "ve",
      timestamps: false,
    }
  );
};
