module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "PhongChieu",
    {
      chiNhanhId: { type: DataTypes.INTEGER, allowNull: false },
      ten: { type: DataTypes.STRING(50), allowNull: false },
      tongSoGhe: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "phongChieu",
      timestamps: false,
    }
  );
};
