module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "PhuongTienMedia",
    {
      phimId: { type: DataTypes.INTEGER, allowNull: false },
      loai: { type: DataTypes.ENUM("poster", "trailer"), allowNull: false },
      duongDan: { type: DataTypes.STRING(255), allowNull: false },
    },
    {
      tableName: "phuongTienMedia",
      timestamps: false,
    }
  );
};
