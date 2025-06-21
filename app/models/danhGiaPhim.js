module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "DanhGiaPhim",
    {
      nguoiDungId: { type: DataTypes.INTEGER, allowNull: false },
      phimId: { type: DataTypes.INTEGER, allowNull: false },
      binhLuanChaId: { type: DataTypes.INTEGER },
      diem: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      binhLuan: { type: DataTypes.TEXT },
      taoLuc: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "danhGiaPhim",
      timestamps: false,
    }
  );
};
