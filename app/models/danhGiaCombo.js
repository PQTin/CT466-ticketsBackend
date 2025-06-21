module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "DanhGiaCombo",
    {
      nguoiDungId: { type: DataTypes.INTEGER, allowNull: false },
      comboId: { type: DataTypes.INTEGER, allowNull: false },
      diem: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      binhLuan: { type: DataTypes.TEXT },
      taoLuc: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "danhGiaCombo",
      timestamps: false,
    }
  );
};
