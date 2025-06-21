module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "ThongBao",
    {
      nguoiDungId: { type: DataTypes.INTEGER, allowNull: false },
      tieuDe: { type: DataTypes.STRING(255), allowNull: false },
      noiDung: { type: DataTypes.TEXT, allowNull: false },
      daDoc: { type: DataTypes.BOOLEAN, defaultValue: false },
      taoLuc: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "thongBao",
      timestamps: false,
    }
  );
};
