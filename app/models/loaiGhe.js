module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "LoaiGhe",
    {
      ten: { type: DataTypes.STRING(50), allowNull: false },
      giaPhu: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    },
    {
      tableName: "loaiGhe",
      timestamps: false,
    }
  );
};
