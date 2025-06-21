module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "ChiNhanh",
    {
      ten: { type: DataTypes.STRING(255), allowNull: false },
      diaChi: { type: DataTypes.TEXT, allowNull: false },
      soDienThoai: { type: DataTypes.STRING(20) },
    },
    {
      tableName: "chiNhanh",
      timestamps: false,
    }
  );
};
