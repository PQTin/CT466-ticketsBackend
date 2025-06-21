module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Ghe",
    {
      phongChieuId: { type: DataTypes.INTEGER, allowNull: false },
      hang: { type: DataTypes.CHAR(1), allowNull: false },
      cot: { type: DataTypes.INTEGER, allowNull: false },
      loaiGheId: { type: DataTypes.INTEGER },
    },
    {
      tableName: "ghe",
      timestamps: false,
      indexes: [{ unique: true, fields: ["phongChieuId", "hang", "cot"] }],
    }
  );
};
