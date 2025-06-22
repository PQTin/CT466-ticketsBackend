module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Phim",
    {
      ten: { type: DataTypes.STRING(255), allowNull: false },
      moTa: { type: DataTypes.TEXT },
      thoiLuong: { type: DataTypes.INTEGER, allowNull: false },
      ngayKhoiChieu: { type: DataTypes.DATEONLY, allowNull: false },
      daXoa: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      thoiDiemXoa: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "phim",
      timestamps: false,
    }
  );
};
