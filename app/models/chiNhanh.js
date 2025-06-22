module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "ChiNhanh",
    {
      ten: { type: DataTypes.STRING(255), allowNull: false },
      diaChi: { type: DataTypes.TEXT, allowNull: false },
      soDienThoai: { type: DataTypes.STRING(20) },
      daXoa: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      thoiDiemXoa: {
        type: DataTypes.DATE,
        defaultValue: null,
      },
    },
    {
      tableName: "chiNhanh",
      timestamps: false,
    }
  );
};
