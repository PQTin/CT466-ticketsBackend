module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "MaGiamGia",
    {
      ma: { type: DataTypes.STRING(50), unique: true, allowNull: false },
      khuyenMaiId: { type: DataTypes.INTEGER },
      nguoiDungId: { type: DataTypes.INTEGER },
      daDung: { type: DataTypes.BOOLEAN, defaultValue: false },
      taoLuc: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      suDungLuc: { type: DataTypes.DATE },
    },
    {
      tableName: "maGiamGia",
      timestamps: false,
    }
  );
};
