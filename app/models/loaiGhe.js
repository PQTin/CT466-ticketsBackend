module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "LoaiGhe",
    {
      ten: { type: DataTypes.STRING(50), allowNull: false },
      giaPhu: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
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
      tableName: "loaiGhe",
      timestamps: false,
    }
  );
};
